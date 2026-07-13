/** Map API / fetch failures to user-friendly hints. */
export function formatServiceError(error: unknown, networkHint: string, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }
  const message = error.message.trim();
  if (!message) {
    return fallback;
  }
  if (/network request failed|failed to fetch|network error|timed out|timeout expired/i.test(message)) {
    return networkHint;
  }
  return message;
}
