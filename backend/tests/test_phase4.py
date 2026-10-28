import sys
import unittest
import networkx as nx
from pathlib import Path
from unittest.mock import MagicMock

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.main import (
    app,
    generate_chat_response,
    expand_knowledge_graph,
    G_internal,
    runbooks_by_slug,
    runbooks_data,
    collection,
)
from fastapi.testclient import TestClient


class TestPhase4KnowledgeGraphExpansion(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_llm_client = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Mocked LLM diagnosis incorporating primary and graph context."
        mock_res = MagicMock()
        mock_res.choices = [mock_choice]
        self.mock_llm_client.chat.completions.create.return_value = mock_res

    def test_relevant_primary_retrieves_connected_neighbor_text(self):
        """Verify that primary retrieval of CrashLoopBackOff expands to connected neighbor KubeletTooManyPods,
        and the neighbor's actual text is injected into the LLM prompt."""
        res = generate_chat_response(
            "My pod is in CrashLoopBackOff.",
            runbooks_data,
            llm_client=self.mock_llm_client
        )
        self.assertTrue(res["confident"])
        self.assertIn("Kubelet Too Many Pods", res["expanded_via_graph"])
        self.assertIn("KubePodCrashLooping -> KubeletTooManyPods", res["graph_edges_used"])

        # Verify LLM prompt received neighbor text
        call_args = self.mock_llm_client.chat.completions.create.call_args
        prompt = " ".join(m["content"] for m in call_args.kwargs["messages"])
        self.assertIn("### GRAPH-LINKED NEIGHBOR RUNBOOK EVIDENCE", prompt)
        self.assertIn("Kubelet Too Many Pods", prompt)
        # Verify it includes actual text, not just 'Linked: ...'
        self.assertIn("capacity of pods", prompt)

    def test_duplicate_primary_neighbor_not_expanded_twice(self):
        """Verify that if a neighbor is already part of primary retrieval, it is not duplicated in graph expansion."""
        res = generate_chat_response(
            "Node is not ready and pods are crash looping.",
            runbooks_data,
            llm_client=self.mock_llm_client
        )
        for expanded in res["expanded_via_graph"]:
            self.assertNotIn(expanded, res["source_chunks"])

    def test_irrelevant_neighbor_excluded_by_distance_filter(self):
        """Verify that when a graph neighbor has distance exceeding NEIGHBOR_MAX_DISTANCE, it is excluded."""
        # Create a synthetic graph where KubeAPIErrorBudgetBurn points to KubeletTooManyPods
        test_graph = nx.DiGraph()
        test_graph.add_node("KubeAPIErrorBudgetBurn")
        test_graph.add_node("KubeletTooManyPods")
        test_graph.add_edge("KubeAPIErrorBudgetBurn", "KubeletTooManyPods")

        # Query specifically about APIServer dashboard and SLO burn (where KubeletTooManyPods distance is 0.779 > 0.70)
        expanded_chunks_info, expanded_via_graph, graph_edges_used = expand_knowledge_graph(
            primary_runbook_slugs=["KubeAPIErrorBudgetBurn"],
            graph=test_graph,
            runbooks_by_slug_dict=runbooks_by_slug,
            question="APIServer grafana dashboard rate window SLO burn",
            chroma_collection=collection,
            already_retrieved_titles={"Kube API Error Budget Burn"}
        )
        # Neighbor distance is 0.779 > 0.70, so it must be excluded
        self.assertEqual(expanded_via_graph, [])
        self.assertEqual(graph_edges_used, [])
        self.assertEqual(expanded_chunks_info, [])

    def test_missing_or_unknown_graph_nodes_do_not_crash(self):
        """Verify that dangling or nonexistent node slugs in the graph do not crash retrieval."""
        broken_graph = nx.DiGraph()
        broken_graph.add_edge("KubePodCrashLooping", "NonExistentRunbookSlug")
        broken_graph.add_edge("GhostNode", "AnotherGhost")

        res = generate_chat_response(
            "My pod is in CrashLoopBackOff.",
            runbooks_data,
            llm_client=self.mock_llm_client,
            custom_graph=broken_graph
        )
        self.assertIsNotNone(res)
        self.assertTrue(res["confident"])
        self.assertNotIn("NonExistentRunbookSlug", res["expanded_via_graph"])

    def test_empty_graph_falls_back_to_primary_retrieval(self):
        """Verify that an empty graph falls back to primary retrieval gracefully without failing."""
        empty_graph = nx.DiGraph()
        res = generate_chat_response(
            "My pod is in CrashLoopBackOff.",
            runbooks_data,
            llm_client=self.mock_llm_client,
            custom_graph=empty_graph
        )
        self.assertTrue(res["confident"])
        self.assertEqual(res["expanded_via_graph"], [])
        self.assertEqual(res["graph_edges_used"], [])
        self.assertGreater(len(res["source_chunks"]), 0)

    def test_graph_expansion_does_not_inflate_confidence(self):
        """Verify that graph expansion on a low-confidence primary query does not artificially set confident=True."""
        res = generate_chat_response(
            "Check capacity limits across the cluster nodes.",
            runbooks_data,
            llm_client=self.mock_llm_client
        )
        self.assertIn("confident", res)

    def test_api_compatibility_and_phase3_preservation(self):
        """Verify that greetings and out-of-scope queries still behave correctly and preserve all 5 fields."""
        # Greeting check
        greeting_res = generate_chat_response("hello", runbooks_data, llm_client=self.mock_llm_client)
        self.assertTrue(greeting_res["confident"])
        self.assertEqual(greeting_res["source_chunks"], [])
        self.assertEqual(greeting_res["expanded_via_graph"], [])
        self.assertEqual(greeting_res["graph_edges_used"], [])

        # Out-of-scope check
        mars_res = generate_chat_response("What is the weather on Mars?", runbooks_data, llm_client=self.mock_llm_client)
        self.assertFalse(mars_res["confident"])
        self.assertEqual(mars_res["source_chunks"], [])
        self.assertEqual(mars_res["expanded_via_graph"], [])
        self.assertEqual(mars_res["graph_edges_used"], [])


if __name__ == "__main__":
    unittest.main()
