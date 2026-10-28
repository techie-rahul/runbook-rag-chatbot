import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.main import (
    app,
    generate_chat_response,
    is_greeting,
    check_topic_support,
    runbooks_data,
    MAX_RELEVANCE_DISTANCE,
    HIGH_CONFIDENCE_DISTANCE,
)
from fastapi.testclient import TestClient


class TestPhase3RetrievalAndRelevance(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Mock LLM client so tests don't consume rate limits or depend on network
        self.mock_llm_client = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Mocked LLM diagnosis based on runbook context."
        mock_res = MagicMock()
        mock_res.choices = [mock_choice]
        self.mock_llm_client.chat.completions.create.return_value = mock_res

    def test_greeting_detector(self):
        """Verify greeting detector accurately catches greetings and ignores technical queries."""
        self.assertTrue(is_greeting("hello"))
        self.assertTrue(is_greeting("Hi"))
        self.assertTrue(is_greeting("hey there"))
        self.assertTrue(is_greeting("who are you"))
        self.assertFalse(is_greeting("My pod is in CrashLoopBackOff"))
        self.assertFalse(is_greeting("What is the meaning of life and redis"))

    def test_greeting_response_bypasses_vector_search(self):
        """Verify greetings receive an introductory answer with empty sources and confident=True."""
        res = generate_chat_response("hello", runbooks_data, llm_client=self.mock_llm_client)
        self.assertTrue(res["confident"])
        self.assertEqual(res["source_chunks"], [])
        self.assertEqual(res["expanded_via_graph"], [])
        self.assertIn("OpsPilot", res["answer"])
        self.assertIn("KubePodCrashLooping", res["answer"])
        # Mock LLM was NOT called
        self.mock_llm_client.chat.completions.create.assert_not_called()

    def test_relevant_retrieval_crashloop(self):
        """Verify that relevant query retrieves matching chunks with high confidence."""
        res = generate_chat_response(
            "My pod is in CrashLoopBackOff.",
            runbooks_data,
            llm_client=self.mock_llm_client
        )
        self.assertTrue(res["confident"])
        self.assertGreater(len(res["source_chunks"]), 0)
        self.assertTrue(any("Crash" in s for s in res["source_chunks"]))
        self.assertEqual(res["answer"], "Mocked LLM diagnosis based on runbook context.")

    def test_relevant_retrieval_api_5xx(self):
        """Verify Kubernetes API 5xx errors retrieve KubeAPIErrorBudgetBurn with high confidence."""
        res = generate_chat_response(
            "The Kubernetes API server is returning 5xx errors.",
            runbooks_data,
            llm_client=self.mock_llm_client
        )
        self.assertTrue(res["confident"])
        self.assertTrue(any("Budget Burn" in s or "API" in s for s in res["source_chunks"]))

    def test_out_of_scope_weather_on_mars(self):
        """Verify completely off-topic query exceeds distance threshold and is rejected safely."""
        res = generate_chat_response(
            "What is the weather on Mars?",
            runbooks_data,
            llm_client=self.mock_llm_client
        )
        self.assertFalse(res["confident"])
        self.assertEqual(res["source_chunks"], [])
        self.assertIn("could not find sufficient evidence", res["answer"].lower())
        self.assertIn("KubePodCrashLooping", res["answer"])

    def test_out_of_scope_redis_timeout_grounding(self):
        """Verify that a query for un-runbooked technology (Redis) is caught by topical grounding."""
        res = generate_chat_response(
            "Analyze a Redis timeout.",
            runbooks_data,
            llm_client=self.mock_llm_client
        )
        self.assertFalse(res["confident"])
        self.assertEqual(res["source_chunks"], [])
        self.assertIn("redis", res["answer"].lower())
        self.assertIn("not covered", res["answer"].lower())

    def test_http_502_unsupported_runbook(self):
        """Verify HTTP 502 query exceeds distance threshold since no 502 runbook is present."""
        res = generate_chat_response(
            "Find the root cause of HTTP 502 errors.",
            runbooks_data,
            llm_client=self.mock_llm_client
        )
        self.assertFalse(res["confident"])
        self.assertEqual(res["source_chunks"], [])
        self.assertIn("could not find sufficient evidence", res["answer"].lower())

    def test_full_api_endpoint_contract(self):
        """Verify that FastAPI /chat endpoint maintains exact backward-compatible contract."""
        response = self.client.post("/chat", json={"question": "hello"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for field in ["answer", "confident", "source_chunks", "expanded_via_graph", "graph_edges_used"]:
            self.assertIn(field, data)
        self.assertTrue(data["confident"])
        self.assertEqual(data["source_chunks"], [])


if __name__ == "__main__":
    unittest.main()
