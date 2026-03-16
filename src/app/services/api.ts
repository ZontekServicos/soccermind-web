import { API_CONFIG } from "../config/api-config";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
  meta?: Record<string, unknown>;
}

function normalizeApiBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed === "/api") {
    return trimmed;
  }

  return trimmed.endsWith("/api") ? trimmed : `${trimmed.replace(/\/$/, "")}/api`;
}

function buildApiBaseCandidates() {
  const candidates = [
    import.meta.env.VITE_API_BASE_URL,
    "/api",
    normalizeApiBaseUrl(API_CONFIG.BASE_URL),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return Array.from(new Set(candidates.map((value) => normalizeApiBaseUrl(value))));
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

function buildApiUrl(baseUrl: string, endpoint: string) {
  return `${baseUrl}${endpoint}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const candidates = buildApiBaseCandidates();
  let lastError: Error | null = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(buildApiUrl(baseUrl, endpoint), {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        ...options,
      });

      const json = (await parseJsonSafely(response)) as ApiEnvelope<T> | null;

      if (!response.ok || json?.success === false) {
        const message = json?.error || `API request failed (${response.status})`;

        if (response.status >= 500 || response.status === 404) {
          lastError = new Error(message);
          continue;
        }

        throw new Error(message);
      }

      if (!json) {
        lastError = new Error("Empty API response");
        continue;
      }

      return json;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Failed to fetch");
    }
  }

  if (lastError?.message === "Failed to fetch") {
    throw new Error("Nao foi possivel conectar a API do SoccerMind.");
  }

  throw lastError ?? new Error("Unknown API error");
}
