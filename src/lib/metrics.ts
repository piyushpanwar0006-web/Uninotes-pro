// ============================================================
// In-memory metrics store
// Tracks: request counts, error rates, durations, file ops
// Resets on each cold start (serverless) — good enough for
// quick health checks without requiring extra infrastructure.
// ============================================================

interface EndpointMetric {
  totalRequests: number;
  totalErrors: number;
  totalDurationMs: number;
  avgDurationMs: number;
  errorRate: string; // percentage string e.g. "12.50%"
}

interface FileOpMetric {
  attempts: number;
  successes: number;
  failures: number;
  successRate: string;
}

interface MetricsStore {
  startedAt: string;
  endpoints: Record<string, EndpointMetric>;
  uploads: FileOpMetric;
  deletes: FileOpMetric;
}

// Singleton store
const store: MetricsStore = {
  startedAt: new Date().toISOString(),
  endpoints: {},
  uploads: { attempts: 0, successes: 0, failures: 0, successRate: '0%' },
  deletes: { attempts: 0, successes: 0, failures: 0, successRate: '0%' },
};

// ============================================================
// Helpers
// ============================================================

function calcSuccessRate(successes: number, attempts: number): string {
  if (attempts === 0) return '0%';
  return ((successes / attempts) * 100).toFixed(2) + '%';
}

// ============================================================
// API Endpoint Tracking
// ============================================================

export function recordRequest(endpoint: string, status: number, durationMs: number) {
  if (!store.endpoints[endpoint]) {
    store.endpoints[endpoint] = {
      totalRequests: 0,
      totalErrors: 0,
      totalDurationMs: 0,
      avgDurationMs: 0,
      errorRate: '0%',
    };
  }

  const m = store.endpoints[endpoint];
  m.totalRequests++;
  m.totalDurationMs += durationMs;
  m.avgDurationMs = Math.round(m.totalDurationMs / m.totalRequests);

  if (status >= 400) {
    m.totalErrors++;
  }

  m.errorRate = ((m.totalErrors / m.totalRequests) * 100).toFixed(2) + '%';
}

// ============================================================
// File Operation Tracking
// ============================================================

export function recordUpload(success: boolean) {
  store.uploads.attempts++;
  if (success) {
    store.uploads.successes++;
  } else {
    store.uploads.failures++;
  }
  store.uploads.successRate = calcSuccessRate(store.uploads.successes, store.uploads.attempts);
}

export function recordDelete(success: boolean) {
  store.deletes.attempts++;
  if (success) {
    store.deletes.successes++;
  } else {
    store.deletes.failures++;
  }
  store.deletes.successRate = calcSuccessRate(store.deletes.successes, store.deletes.attempts);
}

// ============================================================
// Snapshot — used by GET /api/admin/metrics
// ============================================================

export function getMetrics(): MetricsStore {
  return JSON.parse(JSON.stringify(store)); // deep clone
}
