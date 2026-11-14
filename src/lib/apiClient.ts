export interface FetchRetryOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 502, 503, 504]);

export async function fetchJsonWithRetry<T = unknown>(
  url: string,
  options: FetchRetryOptions = {},
): Promise<T> {
  const { timeoutMs = 20000, retries = 1, retryDelayMs = 450, ...fetchInit } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        let serverMessage = `Request failed (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson && typeof errJson.error === 'string' && errJson.error.trim()) {
            serverMessage = errJson.error;
          }
        } catch {
          // Ignore JSON parse error on non-JSON error responses
        }

        const err = new Error(serverMessage);
        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < retries) {
          lastError = err;
          await new Promise((r) => setTimeout(r, retryDelayMs * Math.pow(2, attempt)));
          continue;
        }
        throw err;
      }

      return (await response.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      const normalized =
        err instanceof DOMException && err.name === 'AbortError'
          ? new Error('Request timed out. Please try again.')
          : err instanceof Error
            ? err
            : new Error('Network error occurred.');

      lastError = normalized;
      // Retry network errors & timeouts if retries remain; do not retry explicit 4xx validation errors
      const isHttpClientError =
        normalized.message &&
        !(err instanceof TypeError) &&
        !(err instanceof DOMException && err.name === 'AbortError') &&
        !RETRYABLE_STATUS_CODES.has(0);

      if (attempt < retries && !isHttpClientError) {
        await new Promise((r) => setTimeout(r, retryDelayMs * Math.pow(2, attempt)));
        continue;
      }
      throw normalized;
    }
  }

  throw lastError ?? new Error('Request failed.');
}
