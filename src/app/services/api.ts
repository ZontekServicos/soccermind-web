export const BASE_URL = "https://scout-engine-production.up.railway.app/api";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
  meta?: Record<string, unknown>;
}

async function parseJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response from API");
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const json = (await parseJsonSafely(response)) as ApiEnvelope<T> | null;

  if (!response.ok || json?.success === false) {
    throw new Error(json?.error || `API request failed (${response.status})`);
  }

  if (!json) {
    throw new Error("Empty API response");
  }

  return json;
}
