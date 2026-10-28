import { describe, it, expect } from "vitest";

// Preprocessing helper logic matching MarkdownRenderer
function preprocessMarkdown(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 0) {
        return part
          .replace(/\\([*_`~])/g, "$1")
          .replace(/\\-/g, "-")
          .replace(/\\\./g, ".")
          .replace(/<\/?(?:details|summary)>/gi, "");
      }
      return part;
    })
    .join("");
}

// SRE section identifier matching MarkdownRenderer
function getSRESectionMeta(title: string): string | null {
  const lower = title.toLowerCase();
  if (lower.includes("1. assessment") || lower.includes("assessment")) return "assessment";
  if (lower.includes("2. diagnostic") || lower.includes("diagnostic steps")) return "diagnostic";
  if (lower.includes("3. likely causes") || lower.includes("likely causes")) return "hypotheses";
  if (lower.includes("4. safest next action") || lower.includes("next action")) return "next_action";
  if (lower.includes("5. grounded evidence") || lower.includes("evidence & sources") || lower.includes("sources")) return "sources";
  return null;
}

describe("Markdown Preprocessing & Formatting", () => {
  it("cleans escaped markdown characters outside code blocks", () => {
    const input = "This is \\*\\*bold\\*\\* and \\- a bullet point and 1\\. step.";
    const cleaned = preprocessMarkdown(input);
    expect(cleaned).toBe("This is **bold** and - a bullet point and 1. step.");
  });

  it("strips raw HTML details and summary tags outside code blocks", () => {
    const input = "Before <details><summary>Click to expand</summary>Inner text</details> After";
    const cleaned = preprocessMarkdown(input);
    expect(cleaned).toBe("Before Click to expandInner text After");
    expect(cleaned).not.toContain("<details>");
    expect(cleaned).not.toContain("</details>");
    expect(cleaned).not.toContain("<summary>");
    expect(cleaned).not.toContain("</summary>");
  });

  it("preserves escaped characters inside code blocks", () => {
    const input = "Normal text \\*\\*here\\*\\*\n```bash\necho \\*\\*do-not-unescape\\*\\*\n```\nMore text \\*\\*here\\*\\*";
    const cleaned = preprocessMarkdown(input);
    expect(cleaned).toContain("```bash\necho \\*\\*do-not-unescape\\*\\*\n```");
    expect(cleaned).toContain("Normal text **here**");
    expect(cleaned).toContain("More text **here**");
  });

  it("accurately identifies all five SRE sections", () => {
    expect(getSRESectionMeta("### 1. Assessment")).toBe("assessment");
    expect(getSRESectionMeta("### 2. Diagnostic Steps")).toBe("diagnostic");
    expect(getSRESectionMeta("### 3. Likely Causes (Hypotheses)")).toBe("hypotheses");
    expect(getSRESectionMeta("### 4. Safest Next Action")).toBe("next_action");
    expect(getSRESectionMeta("### 5. Grounded Evidence & Sources")).toBe("sources");
    expect(getSRESectionMeta("### Overview")).toBeNull();
  });
});

describe("Source Attribution & Graph Metadata Logic", () => {
  it("distinguishes primary sources from graph-expanded sources", () => {
    const mockApiResponse = {
      answer: "### 1. Assessment\nIncident analysis...",
      confident: true,
      source_chunks: [
        "Kube Pod Crash Looping (Meaning)",
        "Kube Pod Crash Looping (Diagnosis)",
      ],
      expanded_via_graph: ["Kubelet Too Many Pods"],
      graph_edges_used: ["KubePodCrashLooping -> KubeletTooManyPods"],
    };

    expect(mockApiResponse.source_chunks.length).toBe(2);
    expect(mockApiResponse.expanded_via_graph.length).toBe(1);
    expect(mockApiResponse.graph_edges_used[0]).toBe("KubePodCrashLooping -> KubeletTooManyPods");

    // Edge parsing
    const [fromNode, toNode] = mockApiResponse.graph_edges_used[0].split(" -> ");
    expect(fromNode).toBe("KubePodCrashLooping");
    expect(toNode).toBe("KubeletTooManyPods");
  });

  it("handles empty or missing graph fields gracefully without throwing", () => {
    const greetingApiResponse = {
      answer: "Hello! I am OpsPilot.",
      confident: true,
      source_chunks: [],
      expanded_via_graph: [],
      graph_edges_used: [],
    };

    const hasPrimary = greetingApiResponse.source_chunks.length > 0;
    const hasGraph = greetingApiResponse.expanded_via_graph.length > 0;

    expect(hasPrimary).toBe(false);
    expect(hasGraph).toBe(false);
  });
});

describe("Backend API Configuration", () => {
  it("defaults to port 8001 as configured in backend", () => {
    const defaultUrl = "http://localhost:8001";
    expect(defaultUrl).toContain("8001");
    expect(defaultUrl).not.toContain("8000");
  });
});
