type MonitoringContext = Record<string, unknown>;

export async function captureException(error: unknown, context: MonitoringContext = {}) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  const parsed = parseSentryDsn(dsn);
  if (!parsed) return;

  const exception = normalizeError(error);
  const payload = {
    event_id: crypto.randomUUID().replaceAll("-", ""),
    platform: "javascript",
    level: "error",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    exception: {
      values: [
        {
          type: exception.name,
          value: exception.message,
          stacktrace: exception.stack ? { frames: [{ filename: "server", function: exception.stack }] } : undefined,
        },
      ],
    },
    extra: context,
  };

  try {
    await fetch(parsed.storeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Monitoring must never break payroll workflows.
  }
}

function parseSentryDsn(dsn: string) {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace("/", "");
    const publicKey = url.username;
    if (!projectId || !publicKey) return null;
    return {
      storeUrl: `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_version=7&sentry_key=${publicKey}&sentry_client=mshaharapro-next`,
    };
  } catch {
    return null;
  }
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : JSON.stringify(error));
}
