import os
import re
import logging
from pathlib import Path
import yaml
import networkx as nx
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import openai
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("opspilot")

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
load_dotenv(dotenv_path=BASE_DIR / ".env")
load_dotenv()

# RAG specific imports
from langchain_text_splitters import MarkdownHeaderTextSplitter
import chromadb
from chromadb.utils import embedding_functions

# Determine runbooks directory
RUNBOOKS_DIR = BASE_DIR / "runbooks"
if not RUNBOOKS_DIR.exists() or not list(RUNBOOKS_DIR.glob("*.md")):
    ROOT_RUNBOOKS = BASE_DIR.parent / "runbooks"
    if ROOT_RUNBOOKS.exists() and list(ROOT_RUNBOOKS.glob("*.md")):
        RUNBOOKS_DIR = ROOT_RUNBOOKS


def load_runbooks():
    runbooks = []
    if not RUNBOOKS_DIR.exists():
        return runbooks

    for filepath in RUNBOOKS_DIR.glob("*.md"):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        if content.startswith("---"):
            try:
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    frontmatter = yaml.safe_load(parts[1])
                    body = parts[2].strip()
                    runbooks.append({
                        "slug": filepath.stem,
                        "title": frontmatter.get("title", filepath.stem),
                        "category": frontmatter.get("category", "General"),
                        "severity": frontmatter.get("severity", "Medium"),
                        "tags": frontmatter.get("tags", []),
                        "links": frontmatter.get("links", []),
                        "content": body
                    })
            except Exception as e:
                logger.error(f"Error parsing {filepath}: {e}")
    return runbooks


runbooks_data = load_runbooks()
logger.info(f"Loaded {len(runbooks_data)} runbooks from {RUNBOOKS_DIR}")

# Mapping lookups
runbooks_by_slug = {rb["slug"]: rb for rb in runbooks_data}
slug_by_title = {rb["title"]: rb["slug"] for rb in runbooks_data}


def build_graph(runbooks):
    G = nx.DiGraph()
    for rb in runbooks:
        G.add_node(rb["slug"], title=rb["title"], category=rb["category"])

    for rb in runbooks:
        for link in rb.get("links", []):
            if G.has_node(link):
                G.add_edge(rb["slug"], link)

    nodes = [{"id": n, "title": d.get("title", n), "category": d.get("category", "General")} for n, d in G.nodes(data=True)]
    edges = [{"source": u, "target": v} for u, v in G.edges()]
    return {"nodes": nodes, "edges": edges}


# Internal knowledge graph DiGraph instance
graph_data = build_graph(runbooks_data)
G_internal = nx.DiGraph()
for rb in runbooks_data:
    G_internal.add_node(rb["slug"], title=rb["title"], category=rb["category"])
for rb in runbooks_data:
    for link in rb.get("links", []):
        if G_internal.has_node(link):
            G_internal.add_edge(rb["slug"], link)


# Initialize ChromaDB client and embeddings
logger.info("Initializing ChromaDB and embedding function (all-MiniLM-L6-v2)...")
chroma_client = chromadb.Client()
ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
collection = chroma_client.create_collection(name="runbooks", embedding_function=ef)

# Chunk the markdown runbooks
headers_to_split_on = [
    ("#", "Header 1"),
    ("##", "Header 2"),
    ("###", "Header 3"),
]
markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)

documents = []
metadatas = []
ids = []

chunk_id = 0
for rb in runbooks_data:
    splits = markdown_splitter.split_text(rb["content"])
    for split in splits:
        documents.append(split.page_content)
        meta = {
            "source_runbook": rb["title"],
            "severity": rb["severity"]
        }
        for k, v in split.metadata.items():
            meta[k] = str(v)
        metadatas.append(meta)
        ids.append(f"chunk_{chunk_id}")
        chunk_id += 1

if documents:
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    logger.info(f"Successfully chunked and embedded {len(documents)} snippets into ChromaDB!")


# ── Retrieval Calibration & Graph Constants ─────────────────────────────────
MAX_RELEVANCE_DISTANCE = 0.72
HIGH_CONFIDENCE_DISTANCE = 0.55
RETRIEVAL_CANDIDATES = 6

# Graph expansion parameters
MAX_GRAPH_EXPANSIONS = 2
NEIGHBOR_MAX_DISTANCE = 0.70

GREETING_REGEX = re.compile(
    r"^\s*(hi|hello|hey|howdy|hola|greetings|good\s+(morning|afternoon|evening)|who\s+are\s+you|help)\b",
    re.IGNORECASE
)


def is_greeting(text: str) -> bool:
    clean = text.strip().lower()
    if clean in {"hi", "hello", "hey", "help", "who are you", "who are you?"}:
        return True
    return bool(GREETING_REGEX.match(clean)) and len(clean.split()) <= 5


def check_topic_support(question: str, retrieved_chunks: list[str]) -> tuple[bool, str]:
    """Inspect retrieved content to detect obvious domain mismatches before claiming support."""
    if not retrieved_chunks:
        return False, "No chunks retrieved."
    combined_text = " ".join(retrieved_chunks).lower()
    tech_keywords = ["redis", "postgres", "postgresql", "mysql", "kafka", "rabbitmq", "mars", "weather"]
    q_lower = question.lower()
    for kw in tech_keywords:
        if kw in q_lower and kw not in combined_text:
            return False, f"The query focuses on '{kw}', which is not covered in the retrieved runbook context."
    return True, "Supported"


def expand_knowledge_graph(
    primary_runbook_slugs: list[str],
    graph: nx.DiGraph,
    runbooks_by_slug_dict: dict,
    question: str,
    chroma_collection,
    already_retrieved_titles: set[str],
) -> tuple[list[dict], list[str], list[str]]:
    """
    Identifies direct 1-hop graph neighbors of primary runbooks and retrieves
    their actual grounded text into the context if relevant.
    """
    expanded_chunks_info = []
    expanded_via_graph = []
    graph_edges_used = []
    seen_neighbors = set()

    for u_slug in primary_runbook_slugs:
        if not graph.has_node(u_slug):
            continue

        # Get 1-hop outgoing neighbors (links)
        neighbors = list(graph.successors(u_slug))
        for v_slug in neighbors:
            if v_slug in seen_neighbors:
                continue
            seen_neighbors.add(v_slug)

            target_rb = runbooks_by_slug_dict.get(v_slug)
            if not target_rb:
                continue

            target_title = target_rb["title"]
            # Skip if this neighbor was already retrieved in primary retrieval
            if target_title in already_retrieved_titles:
                continue

            if len(expanded_via_graph) >= MAX_GRAPH_EXPANSIONS:
                break

            # Retrieve top matching chunk from this neighbor runbook
            try:
                neighbor_res = chroma_collection.query(
                    query_texts=[question],
                    n_results=2,
                    where={"source_runbook": target_title},
                    include=["documents", "metadatas", "distances"],
                )
            except Exception as e:
                logger.warning(f"Error querying neighbor '{target_title}': {e}")
                continue

            if not neighbor_res.get("documents") or not neighbor_res["documents"][0]:
                continue

            n_dists = neighbor_res["distances"][0]
            n_docs = neighbor_res["documents"][0]
            n_metas = neighbor_res["metadatas"][0]

            # Find best chunk that has real content and passes relevance threshold
            best_chunk = None
            best_meta = None
            best_dist = 999.0

            for doc, meta, dist in zip(n_docs, n_metas, n_dists):
                sec = meta.get("Header 2") or meta.get("Header 1") or ""
                if not sec and len(n_docs) > 1:
                    continue
                if dist <= NEIGHBOR_MAX_DISTANCE and dist < best_dist:
                    best_dist = dist
                    best_chunk = doc
                    best_meta = meta

            if best_chunk and best_meta:
                expanded_chunks_info.append({
                    "source_runbook": target_title,
                    "section": best_meta.get("Header 2") or best_meta.get("Header 1") or "Overview",
                    "content": best_chunk,
                    "distance": best_dist,
                    "connected_from": u_slug
                })
                expanded_via_graph.append(target_title)
                graph_edges_used.append(f"{u_slug} -> {v_slug}")

    return expanded_chunks_info, expanded_via_graph, graph_edges_used


def clean_runbook_chunk(text: str) -> str:
    """Clean raw markdown runbook chunk by stripping HTML tags (<details>, <summary>) and excessive empty lines."""
    if not text:
        return ""
    cleaned = re.sub(r'</?(?:details|summary)>', '', text, flags=re.IGNORECASE)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()


def build_fallback_response(retrieved_chunks, retrieved_metadata, source_chunks, expanded_via_graph=None, graph_edges_used=None, reason: str = ""):
    """Construct a clean, explicitly labelled retrieval-only response without leaking secrets, stack traces, or raw delimiters."""
    if expanded_via_graph is None:
        expanded_via_graph = []
    if graph_edges_used is None:
        graph_edges_used = []

    reason_lower = (reason or "").lower()
    if "rate limit" in reason_lower:
        notice_header = "> ⚠️ **Notice: AI response generation is temporarily unavailable due to API rate limits. Displaying grounded runbook diagnostic guidance directly:**"
    elif "timed out" in reason_lower:
        notice_header = "> ⚠️ **Notice: AI response request timed out. Displaying grounded runbook diagnostic guidance directly:**"
    elif "not set" in reason_lower:
        notice_header = "> ⚠️ **Notice: GROQ_API_KEY is not configured. Displaying grounded runbook guidance directly:**"
    else:
        notice_header = "> ⚠️ **Notice: AI response generation is currently unavailable. Displaying grounded runbook guidance directly:**"

    if not retrieved_chunks:
        lines = [
            notice_header,
            "",
            "### 📚 Available Cluster Runbooks",
            "No matching runbook sections met the relevance threshold for this query.",
            "",
            "Currently available runbooks in this environment:",
            "- **KubePodCrashLooping** (Pod restarts, container crashes, probe failures)",
            "- **KubeNodeNotReady** (Node conditions, kubelet unresponsiveness, disk/memory pressure)",
            "- **KubeletTooManyPods** (Node capacity and scheduling limits)",
            "- **KubeAPIErrorBudgetBurn** (Kubernetes API server 5xx errors and SLO burn)"
        ]
        return {
            "answer": "\n".join(lines).strip(),
            "confident": False,
            "source_chunks": source_chunks,
            "expanded_via_graph": expanded_via_graph,
            "graph_edges_used": graph_edges_used
        }

    lines = [
        notice_header,
        "",
        "### 📚 Relevant Runbook Sections Found"
    ]

    seen_headers = set()
    count = 0
    for i, chunk in enumerate(retrieved_chunks):
        meta = retrieved_metadata[i] if i < len(retrieved_metadata) else {}
        rb_title = meta.get("source_runbook", "Runbook")
        section = meta.get("Header 2") or meta.get("Header 1") or ""
        header = f"{rb_title} — {section}" if section else rb_title
        if header in seen_headers:
            continue
        seen_headers.add(header)

        cleaned = clean_runbook_chunk(chunk)
        lines.append(f"#### {header}")
        lines.append(cleaned)
        lines.append("")
        count += 1
        if count >= 2:
            break

    return {
        "answer": "\n".join(lines).strip(),
        "confident": False,
        "source_chunks": source_chunks,
        "expanded_via_graph": expanded_via_graph,
        "graph_edges_used": graph_edges_used
    }


def generate_chat_response(question: str, runbooks: list, llm_client=None, custom_graph=None):
    # 0. GREETING HANDLING (Intercept before vector search)
    if is_greeting(question):
        greeting_text = (
            "Hello! I am **OpsPilot**, your AI incident investigation assistant for Kubernetes clusters.\n\n"
            "I can help you diagnose and resolve infrastructure incidents using your operational runbooks:\n"
            "- **KubePodCrashLooping**: Pod restart loops, probe failures, resource limits, and log diagnosis.\n"
            "- **KubeNodeNotReady**: Node unresponsiveness, kubelet issues, and cluster capacity.\n"
            "- **KubeletTooManyPods**: Node pod limit exhaustion and scheduling pressure.\n"
            "- **KubeAPIErrorBudgetBurn**: Kubernetes API server 5xx errors and SLO budget burn.\n\n"
            "How can I assist your investigation today?"
        )
        return {
            "answer": greeting_text,
            "confident": True,
            "source_chunks": [],
            "expanded_via_graph": [],
            "graph_edges_used": []
        }

    # 1. PRIMARY RETRIEVAL (Vector Search)
    results = collection.query(
        query_texts=[question],
        n_results=RETRIEVAL_CANDIDATES,
        include=["documents", "metadatas", "distances"]
    )

    dists = results["distances"][0] if results.get("distances") and results["distances"] else []
    docs = results["documents"][0] if results.get("documents") and results["documents"] else []
    metas = results["metadatas"][0] if results.get("metadatas") and results["metadatas"] else []

    # Distance filtering & deduplication by section
    seen_sections = set()
    retrieved_chunks = []
    retrieved_metadata = []
    retrieved_distances = []
    primary_runbook_slugs = []
    already_retrieved_titles = set()

    for i, dist in enumerate(dists):
        if dist > MAX_RELEVANCE_DISTANCE:
            continue
        meta = metas[i]
        rb_title = meta.get("source_runbook", "Unknown Runbook")
        sec_key = (rb_title, meta.get("Header 2", "") or meta.get("Header 1", ""))
        if sec_key in seen_sections:
            continue
        seen_sections.add(sec_key)
        retrieved_chunks.append(docs[i])
        retrieved_metadata.append(meta)
        retrieved_distances.append(dist)
        already_retrieved_titles.add(rb_title)

        slug = slug_by_title.get(rb_title)
        if slug and slug not in primary_runbook_slugs:
            primary_runbook_slugs.append(slug)

        if len(retrieved_chunks) >= 4:
            break

    # Topic grounding check
    is_supported, topic_reason = check_topic_support(question, retrieved_chunks)

    # If completely out of scope or distance threshold exceeded
    if not retrieved_chunks or not is_supported:
        explanation = (
            f"I could not find sufficient evidence in the available runbooks to answer this question accurately.\n\n"
            f"**Context note:** {topic_reason if not is_supported else 'No runbook sections met the relevance threshold (distance <= ' + str(MAX_RELEVANCE_DISTANCE) + ').'}\n\n"
            f"Currently available runbooks in this environment:\n"
            f"- **KubePodCrashLooping** (Pod crash loops, container failures, probe issues)\n"
            f"- **KubeNodeNotReady** (Node conditions, kubelet unresponsiveness, disk/memory pressure)\n"
            f"- **KubeletTooManyPods** (Node capacity and scheduling limits)\n"
            f"- **KubeAPIErrorBudgetBurn** (Kubernetes API server 5xx errors and SLO burn)"
        )
        return {
            "answer": explanation,
            "confident": False,
            "source_chunks": [],
            "expanded_via_graph": [],
            "graph_edges_used": []
        }

    # Evaluate confidence based on PRIMARY retrieval evidence
    top_dist = retrieved_distances[0] if retrieved_distances else 1.0
    confident = bool((top_dist <= HIGH_CONFIDENCE_DISTANCE) and is_supported)

    # Format Primary Evidence
    source_chunks = []
    primary_context_text = ""
    for i, chunk in enumerate(retrieved_chunks):
        meta = retrieved_metadata[i]
        rb_title = meta.get("source_runbook", "Unknown Runbook")
        section = meta.get("Header 2", "")
        source_chunks.append(f"{rb_title} ({section})" if section else rb_title)
        primary_context_text += f"\n--- PRIMARY RUNBOOK: {rb_title} SECTION: {section} ---\n{chunk}\n"

    # 2. MEANINGFUL KNOWLEDGE GRAPH EXPANSION
    G = custom_graph if custom_graph is not None else G_internal
    expanded_chunks_info, expanded_via_graph, graph_edges_used = expand_knowledge_graph(
        primary_runbook_slugs=primary_runbook_slugs,
        graph=G,
        runbooks_by_slug_dict=runbooks_by_slug,
        question=question,
        chroma_collection=collection,
        already_retrieved_titles=already_retrieved_titles,
    )

    # Format Graph Evidence (only if relevant neighbor chunks were retrieved)
    graph_context_text = ""
    if expanded_chunks_info:
        graph_context_text = "\n### GRAPH-LINKED NEIGHBOR RUNBOOK EVIDENCE (Correlated cluster dependencies):\n"
        for n_item in expanded_chunks_info:
            n_title = n_item["source_runbook"]
            n_sec = n_item["section"]
            n_content = n_item["content"]
            graph_context_text += f"\n--- LINKED RUNBOOK: {n_title} SECTION: {n_sec} (via {n_item['connected_from']}) ---\n{n_content}\n"

    total_context_text = primary_context_text + graph_context_text

    # 3. GENERATION (Groq with OpenAI client)
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    groq_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b").strip()

    if not groq_api_key and llm_client is None:
        logger.warning("GROQ_API_KEY is not configured in environment.")
        return build_fallback_response(retrieved_chunks, retrieved_metadata, source_chunks, expanded_via_graph, graph_edges_used, "GROQ_API_KEY is not set.")

    client = llm_client or OpenAI(
        api_key=groq_api_key,
        base_url="https://api.groq.com/openai/v1"
    )

    system_prompt = (
        "You are OpsPilot, a disciplined Site Reliability Engineering (SRE) incident investigation assistant.\n"
        "Your duty is to provide calm, factual, and strictly evidence-grounded Kubernetes troubleshooting guidance.\n\n"
        "OPERATIONAL CONSTRAINTS:\n"
        "1. Evidence Grounding: Prioritize retrieved runbook evidence over general knowledge. Do not invent dashboards, metric names, alert thresholds, commands, services, or infrastructure details.\n"
        "2. Kubernetes CLI Syntax: All Kubernetes inspection commands MUST use valid kubectl syntax (NEVER 'kubernetes' or other command names). Always write 'kubectl get ...', 'kubectl describe ...', 'kubectl logs ...'. Every shell command must be in a standalone fenced bash code block (```bash ... ```).\n"
        "3. Facts vs. Hypotheses: Never claim a root cause is confirmed unless the evidence explicitly supports it. Clearly label potential causes as hypotheses, not asserted facts.\n"
        "4. Diagnostic Safety: Recommend non-destructive inspection commands first (`kubectl get`, `kubectl describe`, `kubectl logs`). Never recommend destructive remediation, deleting production resources, or restarting critical services without explaining the risk and asking for appropriate human verification.\n"
        "5. Placeholders: Use standard placeholders ($NAMESPACE, $POD, $NODE, $CONTAINER). Do not assume a real environment or execute commands.\n"
        "6. Primary vs. Graph Evidence: Use primary runbook evidence first; frame graph-expanded evidence strictly as a possible diagnostic lead or correlation unless the evidence proves causation, and cite graph-expanded evidence only when its actual text directly supports the recommendation.\n"
        "7. Explicit Uncertainty & Gaps: If the available runbooks are insufficient or evidence is partial, explicitly communicate that limitation in the assessment.\n"
        "8. Concise Diagnostics: Limit Diagnostic Steps to 3 to 4 focused, non-destructive checks with brief explanations. Keep the entire response crisp so all 5 sections are fully rendered within the token budget.\n\n"
        "STRUCTURED RESPONSE FORMAT:\n"
        "Format your answer using these exact Markdown section headings:\n"
        "### 1. Assessment\n"
        "What the evidence indicates and what remains unknown.\n\n"
        "### 2. Diagnostic Steps\n"
        "Ordered list of 3-4 concrete, non-destructive checks. Every command MUST use `kubectl` syntax in a standalone ```bash block. Explain what each check verifies.\n\n"
        "### 3. Likely Causes (Hypotheses)\n"
        "Clearly labeled hypotheses (not asserted facts) supported by the runbook evidence.\n\n"
        "### 4. Safest Next Action\n"
        "The immediate, lowest-risk next step for the on-call engineer.\n\n"
        "### 5. Grounded Evidence & Sources\n"
        "Bulleted attribution of the runbook sections that support the answer (including any graph-expanded runbook cited)."
    )

    user_prompt = (
        f"Provided Runbook Context:\n{total_context_text}\n\n"
        f"User Incident Query: {question}\n\n"
        "Provide an incident investigation response following the structured format."
    )

    try:
        response = client.chat.completions.create(
            model=groq_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=650,
            timeout=30.0
        )
        content = ""
        if response.choices and response.choices[0].message:
            content = (response.choices[0].message.content or "").strip()

        if not content:
            logger.warning(f"Groq model {groq_model} returned empty completion content.")
            return build_fallback_response(retrieved_chunks, retrieved_metadata, source_chunks, expanded_via_graph, graph_edges_used, "Empty completion content returned by model.")

        # Ensure Kubernetes CLI commands strictly use `kubectl` syntax and fix accidental CLI typo
        content = re.sub(
            r'(^|[\s`\'"])kubernetes\s+(-n\b|get\b|describe\b|logs\b|cluster-info\b|top\b|exec\b)',
            r'\1kubectl \2',
            content,
            flags=re.MULTILINE
        )

        return {
            "answer": content,
            "confident": confident,
            "source_chunks": source_chunks,
            "expanded_via_graph": expanded_via_graph,
            "graph_edges_used": graph_edges_used
        }

    except openai.AuthenticationError as e:
        logger.error(f"Groq AuthenticationError: {e}")
        return build_fallback_response(retrieved_chunks, retrieved_metadata, source_chunks, expanded_via_graph, graph_edges_used, "Authentication error.")
    except openai.RateLimitError as e:
        logger.error(f"Groq RateLimitError: {e}")
        return build_fallback_response(retrieved_chunks, retrieved_metadata, source_chunks, expanded_via_graph, graph_edges_used, "Rate limit reached.")
    except openai.NotFoundError as e:
        logger.error(f"Groq NotFoundError: Model '{groq_model}' not found: {e}")
        return build_fallback_response(retrieved_chunks, retrieved_metadata, source_chunks, expanded_via_graph, graph_edges_used, f"Model '{groq_model}' not found.")
    except openai.APITimeoutError as e:
        logger.error(f"Groq APITimeoutError: Request timed out: {e}")
        return build_fallback_response(retrieved_chunks, retrieved_metadata, source_chunks, expanded_via_graph, graph_edges_used, "Request timed out.")
    except openai.APIConnectionError as e:
        logger.error(f"Groq APIConnectionError: Network error: {e}")
        return build_fallback_response(retrieved_chunks, retrieved_metadata, source_chunks, expanded_via_graph, graph_edges_used, "Network connection error.")
    except Exception as e:
        logger.error(f"Groq unexpected error ({type(e).__name__}): {e}")
        return build_fallback_response(retrieved_chunks, retrieved_metadata, source_chunks, expanded_via_graph, graph_edges_used, "Unexpected error.")


app = FastAPI(title="OpsPilot Real RAG Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str


@app.get("/")
def root():
    return {"message": "OpsPilot Backend is running!"}


@app.get("/runbooks")
def get_runbooks():
    return [
        {
            "slug": rb["slug"],
            "title": rb["title"],
            "category": rb["category"],
            "severity": rb["severity"],
            "tags": rb["tags"]
        }
        for rb in runbooks_data
    ]


@app.get("/graph")
def get_graph():
    return build_graph(runbooks_data)


@app.post("/chat")
def chat(req: ChatRequest):
    return generate_chat_response(req.question, runbooks_data)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)