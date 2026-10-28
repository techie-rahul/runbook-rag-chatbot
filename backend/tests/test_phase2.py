import os
import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.main import app, build_fallback_response, generate_chat_response, runbooks_data


class TestPhase2GroqAndFallback(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_fallback_response_formatting(self):
        """Verify that build_fallback_response produces clean Markdown without raw prompt dumps or leaked secrets."""
        mock_chunks = [
            "- Check template via `kubectl get pod`\n- Check pod logs via `kubectl logs`"
        ]
        mock_meta = [{"source_runbook": "Kube Pod Crash Looping", "Header 2": "Diagnosis"}]
        mock_sources = ["Kube Pod Crash Looping (Diagnosis)"]

        res = build_fallback_response(mock_chunks, mock_meta, mock_sources, [], "Test error")
        self.assertFalse(res["confident"])
        self.assertIn("⚠️ **Notice: AI response generation is currently unavailable", res["answer"])
        self.assertIn("#### Kube Pod Crash Looping — Diagnosis", res["answer"])
        self.assertIn("kubectl logs", res["answer"])
        # Check that it never exposes secrets or raw delimiters
        self.assertNotIn("GROQ_API_KEY", res["answer"])
        self.assertNotIn("gsk_", res["answer"])
        self.assertNotIn("USER QUESTION:", res["answer"])
        self.assertNotIn("--- RUNBOOK:", res["answer"])

    def test_invalid_groq_key_graceful_handling(self):
        """Verify that an invalid API key triggers clean fallback without throwing unhandled exceptions or leaking secrets."""
        orig_key = os.environ.get("GROQ_API_KEY")
        try:
            os.environ["GROQ_API_KEY"] = "gsk_invalid_test_key_for_unit_tests"
            response = self.client.post("/chat", json={"question": "What is CrashLoopBackOff?"})
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertFalse(data["confident"])
            self.assertIn("Notice: AI response generation is currently unavailable", data["answer"])
            self.assertNotIn("gsk_invalid_test_key_for_unit_tests", data["answer"])
            self.assertNotIn("Traceback", data["answer"])
        finally:
            if orig_key is not None:
                os.environ["GROQ_API_KEY"] = orig_key

    def test_groq_successful_generation(self):
        """Verify that a valid query generates a real LLM answer with source chunks and confident=True."""
        response = self.client.post("/chat", json={"question": "How do I diagnose a pod in CrashLoopBackOff?"})
        self.assertEqual(response.status_code, 200, f"Expected 200, got {response.status_code}: {response.text}")
        data = response.json()

        # Verify contract
        self.assertIn("answer", data)
        self.assertIn("confident", data)
        self.assertIn("source_chunks", data)
        self.assertIn("expanded_via_graph", data)
        self.assertIn("graph_edges_used", data)

        # Verify answer quality
        self.assertTrue(data["confident"])
        self.assertGreater(len(data["source_chunks"]), 0)
        # Must NOT contain fallback marker or raw prompt dump
        self.assertNotIn("[LLM Generation Failed", data["answer"])
        self.assertNotIn("USER QUESTION:", data["answer"])
        self.assertGreater(len(data["answer"].strip()), 30)
        print("\n[test_groq_successful_generation generated answer sample]:\n", data["answer"][:200], "...\n")


if __name__ == "__main__":
    unittest.main()
