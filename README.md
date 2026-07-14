# 🤖 Runbook RAG Chatbot

An AI-powered **Runbook Assistant** built for **HPE Synergy 2026**.

The project leverages **Retrieval-Augmented Generation (RAG)**, **Hybrid Search**, and **GraphRAG** to help users retrieve relevant runbooks, analyze issues, and generate grounded AI responses with source citations.

---

## 🛠️ Tech Stack

| **Component** | **Technology** | **Reason** |
|--------------|----------------|------------|
| **Frontend** | React + Vite + Tailwind CSS + shadcn/ui | Modern, responsive and professional UI with better demo experience than Streamlit. |
| **Backend API** | Python + FastAPI | Best ecosystem for RAG and seamless integration with the React frontend. |
| **Vector Database** | ChromaDB | Lightweight, local and ideal for hackathons. |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2) | Free, CPU-friendly semantic embeddings with no API key required. |
| **Keyword Search** | rank_bm25 | Provides exact keyword matching and enables Hybrid Retrieval. |
| **LLM** | Claude / OpenAI / Gemini | Generates grounded responses using retrieved runbook context. |
| **Graph Retrieval** | NetworkX | Maintains relationships between linked runbooks for GraphRAG. |
| **Graph Visualization** | React Flow | Interactive graph visualization integrated with React. |
| **Charts & Analytics** | Recharts | Displays retrieval accuracy, confidence scores, and latency. |
| **Knowledge Base** | Markdown (.md) Runbooks | Easy to maintain, version control, and parse. |
| **Version Control** | Git + GitHub | Supports collaboration through branches and pull requests. |
| **Deployment** | Vercel (Frontend) + Render/Railway (Backend) | Simple deployment and demo sharing. |

---

## 🏗️ Architecture Overview

```text
                    React Frontend
                           │
                           ▼
                    FastAPI Backend
                           │
                           ▼
          Hybrid Retrieval (BM25 + ChromaDB)
                           │
                           ▼
             GraphRAG (NetworkX Engine)
                           │
                           ▼
            LLM (Claude / OpenAI / Gemini)
                           │
                           ▼
      Grounded Response + Source Citation
```

---

## 📂 Project Structure

```text
runbook-rag-chatbot/
│
├── frontend/        # React application
├── backend/         # FastAPI backend
├── runbooks/        # Markdown runbooks
├── docs/            # Documentation
├── README.md
└── .gitignore
```

---

##  Git Workflow

1. Create a feature branch from `develop`.
2. Implement your feature.
3. Commit and push your changes.
4. Open a Pull Request to `develop`.
5. After testing, merge `develop` into `main`.

---

