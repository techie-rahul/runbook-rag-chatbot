import sys
import unittest
import openai
from pathlib import Path
from unittest.mock import MagicMock

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.main import (
    app,
    generate_chat_response,
    build_fallback_response,
    runbooks_data,
    collection,
)
from fastapi.testclient import TestClient


class TestPhase5SREPromptAndStructuredFormat(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_llm_client = MagicMock()

    def test_supported_crashloopbackoff_prompt_and_structured_format(self):
        """Test that CrashLoopBackOff query generates the structured 5-part prompt with SRE constraints."""
        structured_mock_answer = (
            "### 1. Assessment\n"
            "Pod in $NAMESPACE is in a CrashLoopBackOff state, indicating repeated container termination after startup. Exact exit code and failure logs remain unknown until inspected.\n\n"
            "### 2. Diagnostic Steps\n"
            "1. Inspect pod events: `kubectl describe pod $POD -n $NAMESPACE`\n"
            "2. Retrieve previous container crash logs: `kubectl logs $POD -n $NAMESPACE --previous`\n\n"
            "### 3. Likely Causes (Hypotheses)\n"
            "- Hypothesis 1: Application initialization failure or missing required environment variables.\n"
            "- Hypothesis 2: Liveness/Readiness probe misconfiguration causing kubelet restarts.\n"
            "- Hypothesis 3: OOMKilled condition if container memory limit is exceeded.\n\n"
            "### 4. Safest Next Action\n"
            "Run non-destructive `kubectl describe pod $POD -n $NAMESPACE` to verify Termination Reason and Exit Code before taking any recovery action.\n\n"
            "### 5. Grounded Evidence & Sources\n"
            "- KubePodCrashLooping (Diagnosis & Investigation Steps)"
        )
        mock_choice = MagicMock()
        mock_choice.message.content = structured_mock_answer
        mock_res = MagicMock()
        mock_res.choices = [mock_choice]
        self.mock_llm_client.chat.completions.create.return_value = mock_res

        res = generate_chat_response(
            "My pod is in CrashLoopBackOff.",
            runbooks_data,
            llm_client=self.mock_llm_client
        )

        # 1. API contract verification
        self.assertIn("answer", res)
        self.assertIn("confident", res)
        self.assertIn("source_chunks", res)
        self.assertIn("expanded_via_graph", res)
        self.assertIn("graph_edges_used", res)
        self.assertTrue(res["confident"])

        # 2. System prompt verification
        call_args = self.mock_llm_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        system_content = messages[0]["content"]
        user_content = messages[1]["content"]

        # Verify strict SRE prompt instructions
        self.assertIn("disciplined Site Reliability Engineering (SRE)", system_content)
        self.assertIn("Prioritize retrieved runbook evidence", system_content)
        self.assertIn("Do not invent dashboards, metric names", system_content)
        self.assertIn("Never claim a root cause is confirmed", system_content)
        self.assertIn("Never recommend destructive remediation", system_content)
        self.assertIn("standard placeholders ($NAMESPACE, $POD", system_content)

        # 3. Verify 5 exact structured sections in answer
        answer = res["answer"]
        self.assertIn("### 1. Assessment", answer)
        self.assertIn("### 2. Diagnostic Steps", answer)
        self.assertIn("### 3. Likely Causes", answer)
        self.assertIn("### 4. Safest Next Action", answer)
        self.assertIn("### 5. Grounded Evidence & Sources", answer)

        # 4. Verify safety and placeholders
        self.assertIn("$NAMESPACE", answer)
        self.assertIn("$POD", answer)

    def test_supported_apiserver_5xx_structured_response(self):
        """Test that Kubernetes API server 5xx error question receives structured SRE guidance."""
        structured_mock_answer = (
            "### 1. Assessment\n"
            "The Kubernetes API server is failing requests with 5xx status codes, indicating control plane degradation or etcd latency.\n\n"
            "### 2. Diagnostic Steps\n"
            "1. Check API server health endpoints: `kubectl get --raw /healthz` and `kubectl get --raw /livez`\n"
            "2. Review API server pod logs in kube-system: `kubectl logs kube-apiserver-$NODE -n kube-system`\n\n"
            "### 3. Likely Causes (Hypotheses)\n"
            "- Hypothesis 1: etcd request latency or leader election churn.\n"
            "- Hypothesis 2: API priority and fairness queue saturation.\n\n"
            "### 4. Safest Next Action\n"
            "Execute read-only health checks on the control plane without restarting services.\n\n"
            "### 5. Grounded Evidence & Sources\n"
            "- KubeAPIErrorBudgetBurn (Overview & SLOs)"
        )
        mock_choice = MagicMock()
        mock_choice.message.content = structured_mock_answer
        mock_res = MagicMock()
        mock_res.choices = [mock_choice]
        self.mock_llm_client.chat.completions.create.return_value = mock_res

        res = generate_chat_response(
            "The Kubernetes API server is returning 5xx errors.",
            runbooks_data,
            llm_client=self.mock_llm_client
        )
        self.assertTrue(res["confident"])
        self.assertIn("### 1. Assessment", res["answer"])
        self.assertIn("### 2. Diagnostic Steps", res["answer"])
        self.assertIn("### 3. Likely Causes", res["answer"])
        self.assertIn("### 4. Safest Next Action", res["answer"])
        self.assertIn("### 5. Grounded Evidence & Sources", res["answer"])

    def test_partial_evidence_uncertainty_stated(self):
        """Verify prompt forces explicit communication of data gaps and limitations."""
        # Query with partial relevance
        mock_choice = MagicMock()
        mock_choice.message.content = (
            "### 1. Assessment\n"
            "The retrieved runbook for KubeNodeNotReady discusses node status transitions, but the specific CNI plugin configuration is not documented in the available runbooks.\n\n"
            "### 2. Diagnostic Steps\n"
            "1. Check node conditions: `kubectl describe node $NODE`\n\n"
            "### 3. Likely Causes (Hypotheses)\n"
            "- Hypothesis 1: Kubelet stopped posting status due to network or container runtime failure.\n\n"
            "### 4. Safest Next Action\n"
            "Inspect systemd kubelet logs on the node directly: `journalctl -u kubelet -n 100`.\n\n"
            "### 5. Grounded Evidence & Sources\n"
            "- KubeNodeNotReady"
        )
        mock_res = MagicMock()
        mock_res.choices = [mock_choice]
        self.mock_llm_client.chat.completions.create.return_value = mock_res

        res = generate_chat_response(
            "Why is my node network plugin failing and causing NodeNotReady?",
            runbooks_data,
            llm_client=self.mock_llm_client
        )
        call_args = self.mock_llm_client.chat.completions.create.call_args
        system_content = call_args.kwargs["messages"][0]["content"]
        self.assertIn("Explicit Uncertainty & Gaps", system_content)

    def test_unsupported_queries_do_not_force_5_part_structure(self):
        """Verify out-of-scope or unsupported queries (Redis, Mars, HTTP 502) stay concise and do not force 5-part structure."""
        # Redis query
        redis_res = generate_chat_response("Analyze a Redis timeout.", runbooks_data, llm_client=self.mock_llm_client)
        self.assertFalse(redis_res["confident"])
        self.assertNotIn("### 1. Assessment", redis_res["answer"])
        self.assertIn("redis", redis_res["answer"].lower())
        self.assertIn("Currently available runbooks in this environment", redis_res["answer"])

        # HTTP 502 query
        http502_res = generate_chat_response("Find the root cause of HTTP 502 errors.", runbooks_data, llm_client=self.mock_llm_client)
        self.assertFalse(http502_res["confident"])
        self.assertNotIn("### 1. Assessment", http502_res["answer"])
        self.assertIn("Currently available runbooks in this environment", http502_res["answer"])

        # Weather on Mars
        mars_res = generate_chat_response("What is the weather on Mars?", runbooks_data, llm_client=self.mock_llm_client)
        self.assertFalse(mars_res["confident"])
        self.assertNotIn("### 1. Assessment", mars_res["answer"])

    def test_greetings_remain_concise_without_5_part_structure(self):
        """Verify greetings return a friendly prompt without the 5-part incident format."""
        greet_res = generate_chat_response("hello there", runbooks_data, llm_client=self.mock_llm_client)
        self.assertTrue(greet_res["confident"])
        self.assertNotIn("### 1. Assessment", greet_res["answer"])
        self.assertIn("OpsPilot", greet_res["answer"])
        self.assertEqual(greet_res["source_chunks"], [])

    def test_graph_expanded_evidence_attribution(self):
        """Verify that when graph evidence is present, the prompt clearly distinguishes it and instructs conditional citation."""
        mock_choice = MagicMock()
        mock_choice.message.content = "Assessment with graph correlation."
        mock_res = MagicMock()
        mock_res.choices = [mock_choice]
        self.mock_llm_client.chat.completions.create.return_value = mock_res

        res = generate_chat_response("My pod is in CrashLoopBackOff.", runbooks_data, llm_client=self.mock_llm_client)
        call_args = self.mock_llm_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        system_content = messages[0]["content"]
        user_content = messages[1]["content"]

        # Instruction explicitly requires primary evidence first and graph evidence cited only when text supports it
        self.assertIn("Primary vs. Graph Evidence", system_content)
        self.assertIn("cite graph-expanded evidence only when its actual text directly supports the recommendation", system_content)
        # Graph section should be present in user context
        self.assertIn("### GRAPH-LINKED NEIGHBOR RUNBOOK EVIDENCE", user_content)

    def test_llm_failure_uses_clean_fallback(self):
        """Verify that LLM errors (e.g. rate limit, auth error) still trigger clean markdown fallback without leaking traces."""
        self.mock_llm_client.chat.completions.create.side_effect = openai.RateLimitError("Rate limit exceeded", response=MagicMock(), body={})

        res = generate_chat_response("My pod is in CrashLoopBackOff.", runbooks_data, llm_client=self.mock_llm_client)
        self.assertFalse(res["confident"])
        self.assertIn("⚠️ **Notice: AI response generation is temporarily unavailable due to API rate limits", res["answer"])
        self.assertIn("### 📚 Relevant Runbook Sections Found", res["answer"])
        self.assertNotIn("Traceback", res["answer"])
        self.assertNotIn("Rate limit exceeded", res["answer"])  # Don't leak raw internal error text to users

    def test_command_formatting_and_code_fence_preservation(self):
        """Verify that CLI commands with typo 'kubernetes' are sanitized to 'kubectl' without modifying legitimate text."""
        mock_choice = MagicMock()
        mock_choice.message.content = (
            "### 1. Assessment\n"
            "Pod is failing. Note that Kubernetes is an orchestration system.\n\n"
            "### 2. Diagnostic Steps\n"
            "1. Inspect logs: `kubernetes -n $NAMESPACE logs $POD`\n"
            "2. Check status:\n"
            "```bash\n"
            "kubernetes get pod $POD -n $NAMESPACE\n"
            "```\n\n"
            "### 3. Likely Causes (Hypotheses)\n"
            "- Hypothesis 1: Configuration failure.\n\n"
            "### 4. Safest Next Action\n"
            "Run non-destructive kubectl commands.\n\n"
            "### 5. Grounded Evidence & Sources\n"
            "- KubePodCrashLooping"
        )
        mock_res = MagicMock()
        mock_res.choices = [mock_choice]
        self.mock_llm_client.chat.completions.create.return_value = mock_res

        res = generate_chat_response("My pod is in CrashLoopBackOff.", runbooks_data, llm_client=self.mock_llm_client)
        answer = res["answer"]

        # Command typo was fixed
        self.assertIn("`kubectl -n $NAMESPACE logs $POD`", answer)
        self.assertIn("kubectl get pod $POD -n $NAMESPACE", answer)
        self.assertNotIn("kubernetes -n $NAMESPACE", answer)
        self.assertNotIn("kubernetes get pod", answer)

        # Legitimate text 'Kubernetes is an orchestration system' preserved
        self.assertIn("Kubernetes is an orchestration system", answer)

    def test_simulated_timeout_fallback(self):
        """Verify that APITimeoutError triggers clean timeout-specific fallback notice."""
        self.mock_llm_client.chat.completions.create.side_effect = openai.APITimeoutError(request=MagicMock())

        res = generate_chat_response("My pod is in CrashLoopBackOff.", runbooks_data, llm_client=self.mock_llm_client)
        self.assertFalse(res["confident"])
        self.assertIn("⚠️ **Notice: AI response request timed out", res["answer"])
        self.assertIn("### 📚 Relevant Runbook Sections Found", res["answer"])
        self.assertNotIn("Traceback", res["answer"])

    def test_fallback_cleans_html_details_tags(self):
        """Verify that build_fallback_response strips raw HTML details/summary tags from runbook chunks."""
        raw_chunk_with_html = (
            "The alert fires when node capacity is exceeded.\n\n"
            "<details>\n"
            "<summary>Full context</summary>\n\n"
            "Kubelets have a configuration that limits pods to 110.\n"
            "</details>"
        )
        res = build_fallback_response(
            retrieved_chunks=[raw_chunk_with_html],
            retrieved_metadata=[{"source_runbook": "Kubelet Too Many Pods", "Header 2": "Meaning"}],
            source_chunks=["Kubelet Too Many Pods (Meaning)"],
            reason="Rate limit reached."
        )
        self.assertNotIn("<details>", res["answer"])
        self.assertNotIn("</details>", res["answer"])
        self.assertNotIn("<summary>", res["answer"])
        self.assertNotIn("</summary>", res["answer"])
        self.assertIn("Kubelets have a configuration that limits pods to 110.", res["answer"])

    def test_empty_retrieval_fallback(self):
        """Verify that build_fallback_response handles empty retrieved chunks cleanly without crashing."""
        res = build_fallback_response(
            retrieved_chunks=[],
            retrieved_metadata=[],
            source_chunks=[],
            reason="Rate limit reached."
        )
        self.assertFalse(res["confident"])
        self.assertIn("### 📚 Available Cluster Runbooks", res["answer"])
        self.assertIn("No matching runbook sections met the relevance threshold", res["answer"])
        self.assertIn("KubePodCrashLooping", res["answer"])

    def test_api_compatibility_and_contract(self):
        """Verify end-to-end FastAPI endpoint compatibility with all 5 frontend contract fields."""
        # Use TestClient to hit /chat endpoint
        # Mock LLM inside generate_chat_response for endpoint test
        mock_choice = MagicMock()
        mock_choice.message.content = (
            "### 1. Assessment\nHealthy assessment.\n\n"
            "### 2. Diagnostic Steps\nCheck pods.\n\n"
            "### 3. Likely Causes (Hypotheses)\nHypothesis 1.\n\n"
            "### 4. Safest Next Action\nRead logs.\n\n"
            "### 5. Grounded Evidence & Sources\nKubePodCrashLooping"
        )
        mock_res = MagicMock()
        mock_res.choices = [mock_choice]

        import app.main as app_main
        orig_generate = app_main.generate_chat_response

        def wrapped_gen(q, rb):
            return orig_generate(q, rb, llm_client=self.mock_llm_client)

        app_main.generate_chat_response = wrapped_gen
        try:
            self.mock_llm_client.chat.completions.create.return_value = mock_res
            response = self.client.post("/chat", json={"question": "My pod is in CrashLoopBackOff."})
            self.assertEqual(response.status_code, 200)
            data = response.json()
            for key in ["answer", "confident", "source_chunks", "expanded_via_graph", "graph_edges_used"]:
                self.assertIn(key, data)
            self.assertIsInstance(data["answer"], str)
            self.assertIsInstance(data["confident"], bool)
            self.assertIsInstance(data["source_chunks"], list)
            self.assertIsInstance(data["expanded_via_graph"], list)
            self.assertIsInstance(data["graph_edges_used"], list)
            self.assertIn("### 1. Assessment", data["answer"])
        finally:
            app_main.generate_chat_response = orig_generate


if __name__ == "__main__":
    unittest.main()
