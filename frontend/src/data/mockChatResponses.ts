import type { ChatMessage, RetrievedSource, IncidentAnalysis } from "@/types";

/* ──────────────────────────────────────────────
   Mock chat response data.
   Matches keywords in the user query to return
   realistic DevOps incident analysis.
   ────────────────────────────────────────────── */

interface MockEntry {
  keywords: string[];
  analysis: IncidentAnalysis;
  sources: RetrievedSource[];
}

const MOCK_ENTRIES: MockEntry[] = [
  {
    keywords: ["crashloopbackoff", "crashloop", "crash", "kubernetes", "k8s", "pod", "restart"],
    analysis: {
      summary:
        "Multiple pods in the `payments-service` deployment are entering CrashLoopBackOff state. The containers start, run for 2-5 seconds, then exit with code 137 (OOMKilled). This has been occurring since the last deployment at 14:32 UTC.",
      rootCause:
        "The application's memory consumption exceeds the configured container memory limit of 256Mi. Heap dump analysis shows a memory leak in the connection pool manager — idle database connections are not being released, causing the JVM heap to grow unbounded until the kernel OOM killer terminates the process.",
      suggestedResolution:
        "1. **Immediate**: Increase the memory limit to 512Mi to stabilize pods.\n2. **Short-term**: Set `max-idle-connections: 10` and `idle-timeout: 30s` in the connection pool config.\n3. **Long-term**: Upgrade the database driver to v4.2+ which includes the connection leak fix (CVE-2024-31022).\n4. Run `kubectl rollout restart deployment/payments-service` after applying changes.",
      confidence: 92,
      relatedRunbooks: [
        { id: "rb-1", title: "Kubernetes Pod Debugging Guide", category: "Kubernetes" },
        { id: "rb-2", title: "OOMKilled Troubleshooting", category: "Kubernetes" },
        { id: "rb-3", title: "JVM Memory Tuning", category: "Application" },
      ],
    },
    sources: [
      {
        id: "src-1",
        title: "Runbook: Kubernetes CrashLoopBackOff Resolution",
        relevanceScore: 0.95,
        snippet: "When a pod enters CrashLoopBackOff, Kubernetes is trying to restart it repeatedly. Check exit codes: 137 indicates OOMKilled, 1 indicates application error...",
        content: "Full runbook content covering CrashLoopBackOff diagnosis, including log analysis, resource limit checking, and common root causes such as OOM, missing configs, and dependency failures.",
        category: "Kubernetes",
      },
      {
        id: "src-2",
        title: "Runbook: Container Memory Limits Best Practices",
        relevanceScore: 0.87,
        snippet: "Set resource requests and limits based on P99 memory usage under load. Use vertical pod autoscaler (VPA) for recommendations...",
        content: "Guidelines for setting memory requests and limits, monitoring memory usage with Prometheus, and configuring VPA for automated right-sizing.",
        category: "Kubernetes",
      },
      {
        id: "src-3",
        title: "Runbook: Connection Pool Configuration",
        relevanceScore: 0.72,
        snippet: "Database connection pools should be configured with max-idle and idle-timeout to prevent connection leaks. Monitor active connections via metrics...",
        content: "Detailed guide on configuring HikariCP, PgBouncer, and other connection pool managers with recommended settings for production environments.",
        category: "Database",
      },
    ],
  },
  {
    keywords: ["redis", "timeout", "cache", "latency", "slow"],
    analysis: {
      summary:
        "Redis cluster is experiencing intermittent timeout errors. The `session-cache` Redis instance shows response times spiking from 1ms to 800ms+, causing upstream service timeouts. Approximately 12% of requests are affected.",
      rootCause:
        "The Redis instance is running `KEYS *` pattern scans from a monitoring cron job every 60 seconds, blocking the single-threaded event loop. Combined with a sudden increase in cache key count (from 50K to 2.1M due to a missing TTL on session keys), these scans are taking 600-900ms each.",
      suggestedResolution:
        "1. **Immediate**: Stop the monitoring cron job executing `KEYS *` commands.\n2. **Short-term**: Replace `KEYS` with `SCAN` cursor-based iteration in the monitoring script.\n3. **Critical**: Add TTL of 3600s to all session keys: `EXPIRE session:* 3600`.\n4. **Monitoring**: Set up `slowlog` alerts for commands exceeding 10ms.",
      confidence: 88,
      relatedRunbooks: [
        { id: "rb-4", title: "Redis Performance Troubleshooting", category: "Database" },
        { id: "rb-5", title: "Cache TTL Best Practices", category: "Database" },
      ],
    },
    sources: [
      {
        id: "src-4",
        title: "Runbook: Redis Latency Diagnosis",
        relevanceScore: 0.93,
        snippet: "Use SLOWLOG GET 10 to identify slow commands. The KEYS command is O(N) and should never be used in production...",
        content: "Complete guide to diagnosing Redis latency issues using slowlog, latency monitoring, and client-side timeout configuration.",
        category: "Database",
      },
      {
        id: "src-5",
        title: "Runbook: Redis Memory Management",
        relevanceScore: 0.79,
        snippet: "Monitor used_memory and evicted_keys metrics. Configure maxmemory-policy to allkeys-lru for cache workloads...",
        content: "Redis memory management best practices including eviction policies, key expiration, and memory fragmentation analysis.",
        category: "Database",
      },
    ],
  },
  {
    keywords: ["502", "bad gateway", "gateway", "http", "nginx", "proxy", "upstream"],
    analysis: {
      summary:
        "The API gateway is returning HTTP 502 Bad Gateway errors for 34% of requests to the `/api/v2/orders` endpoint. Error rate increased from 0.1% to 34% starting at 09:15 UTC. Other endpoints are unaffected.",
      rootCause:
        "The `orders-service` deployment scaled down from 5 to 1 replica due to a misconfigured HPA (Horizontal Pod Autoscaler) — the CPU threshold was set to 10% instead of 80%. The single remaining pod cannot handle the request volume, causing connection queuing and upstream timeouts that NGINX reports as 502.",
      suggestedResolution:
        "1. **Immediate**: Manually scale the deployment: `kubectl scale deployment/orders-service --replicas=5`.\n2. **Fix HPA**: Correct `targetCPUUtilizationPercentage` from 10 to 80.\n3. **Guard**: Add `minReplicas: 3` to prevent scale-to-one scenarios.\n4. **NGINX**: Set `proxy_next_upstream error timeout http_502` to enable retry on 502.",
      confidence: 95,
      relatedRunbooks: [
        { id: "rb-6", title: "HTTP 502 Troubleshooting Guide", category: "Networking" },
        { id: "rb-7", title: "HPA Configuration Reference", category: "Kubernetes" },
        { id: "rb-8", title: "NGINX Reverse Proxy Tuning", category: "Networking" },
      ],
    },
    sources: [
      {
        id: "src-6",
        title: "Runbook: HTTP 502 Bad Gateway Resolution",
        relevanceScore: 0.97,
        snippet: "A 502 error means the gateway received an invalid response from the upstream server. Check upstream service health, connection limits, and timeout settings...",
        content: "Step-by-step guide for diagnosing 502 errors across NGINX, HAProxy, and cloud load balancers.",
        category: "Networking",
      },
      {
        id: "src-7",
        title: "Runbook: Kubernetes HPA Troubleshooting",
        relevanceScore: 0.82,
        snippet: "Verify HPA configuration with kubectl get hpa. Check metrics-server is running and reporting correct CPU/memory values...",
        content: "Guide to debugging HPA scaling decisions, metric sources, and cooldown periods.",
        category: "Kubernetes",
      },
    ],
  },
  {
    keywords: ["database", "connection", "failure", "refused", "postgres", "mysql", "sql", "db"],
    analysis: {
      summary:
        "Application services are failing to establish new database connections to the PostgreSQL primary. Active connection count is at 300/300 (max_connections limit). Connection wait queue is growing, causing request timeouts across 4 downstream services.",
      rootCause:
        "A recent deployment of the `reporting-service` introduced a bug where database connections opened in batch processing are not being returned to the pool. Each batch job leaks 15 connections. With batch jobs running every 5 minutes, the connection pool is exhausted within 2 hours of deployment.",
      suggestedResolution:
        "1. **Immediate**: Kill idle connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes'`.\n2. **Hotfix**: Wrap batch processing in try/finally to ensure connection release.\n3. **Config**: Set `idle_in_transaction_session_timeout = '30s'` in postgresql.conf.\n4. **Monitor**: Alert on `pg_stat_activity` count > 80% of max_connections.",
      confidence: 90,
      relatedRunbooks: [
        { id: "rb-9", title: "PostgreSQL Connection Management", category: "Database" },
        { id: "rb-10", title: "Connection Pool Troubleshooting", category: "Database" },
      ],
    },
    sources: [
      {
        id: "src-8",
        title: "Runbook: Database Connection Exhaustion",
        relevanceScore: 0.94,
        snippet: "When max_connections is reached, new connections are refused. Monitor pg_stat_activity for idle and idle-in-transaction connections...",
        content: "Complete guide for diagnosing and resolving PostgreSQL connection exhaustion including PgBouncer setup.",
        category: "Database",
      },
      {
        id: "src-9",
        title: "Runbook: Connection Pool Best Practices",
        relevanceScore: 0.85,
        snippet: "Configure pool size as: connections = (core_count * 2) + effective_spindle_count. Set connection max lifetime to prevent stale connections...",
        content: "Guidelines for sizing connection pools, configuring timeouts, and monitoring connection health.",
        category: "Database",
      },
    ],
  },
];

const FALLBACK: MockEntry = {
  keywords: [],
  analysis: {
    summary:
      "Analyzing the reported infrastructure issue. Based on the available runbook data and incident patterns, the system has identified potential causes and recommended actions.",
    rootCause:
      "The issue appears to be related to resource contention or misconfiguration in the affected service. Further investigation with detailed logs and metrics is recommended to confirm the exact root cause.",
    suggestedResolution:
      "1. **Collect data**: Gather logs from the affected service using `kubectl logs` or your centralized logging platform.\n2. **Check metrics**: Review CPU, memory, and network metrics in Grafana for anomalies.\n3. **Review changes**: Check recent deployments or configuration changes that correlate with the incident timeline.\n4. **Escalate**: If the issue persists, escalate to the platform team with the collected evidence.",
    confidence: 65,
    relatedRunbooks: [
      { id: "rb-gen-1", title: "General Incident Response Playbook", category: "General" },
      { id: "rb-gen-2", title: "Observability & Debugging Guide", category: "Monitoring" },
    ],
  },
  sources: [
    {
      id: "src-gen-1",
      title: "Runbook: General Incident Triage",
      relevanceScore: 0.68,
      snippet: "Start by identifying the blast radius. Determine which services, teams, and customers are impacted...",
      content: "General framework for triaging production incidents including communication templates and escalation procedures.",
      category: "General",
    },
  ],
};

/** Find the best matching mock response for a given query */
export function getMockResponse(query: string): ChatMessage {
  const lowerQuery = query.toLowerCase();

  const match = MOCK_ENTRIES.find((entry) =>
    entry.keywords.some((kw) => lowerQuery.includes(kw))
  ) ?? FALLBACK;

  return {
    id: `asst-${Date.now()}`,
    role: "assistant",
    content: match.analysis.summary,
    timestamp: new Date(),
    analysis: match.analysis,
    sources: match.sources,
  };
}
