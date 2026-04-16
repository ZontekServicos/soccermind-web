import { API_CONFIG } from "../config/api-config";
import { supabase } from "../lib/supabase";

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

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // sem sessão ativa — request sem token
  }
  return {};
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const candidates = buildApiBaseCandidates();
  const authHeader = await getAuthHeader();
  let lastError: Error | null = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(buildApiUrl(baseUrl, endpoint), {
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
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
