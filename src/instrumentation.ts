import { captureException } from "@/lib/monitoring";

export async function register() {
  // Monitoring is configured lazily through SENTRY_DSN.
}

export function onRequestError(error: unknown, request: { path?: string; method?: string }, context: { routerKind?: string; routePath?: string }) {
  void captureException(error, {
    source: "onRequestError",
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
  });
}
