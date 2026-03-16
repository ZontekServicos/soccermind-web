/**
 * Soccer Mind API Configuration
 * Centralized configuration for API integration
 */

const ENV_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

export const API_CONFIG = {
  /**
   * Base URL for the backend API
   */
  BASE_URL: normalizeBaseUrl(ENV_API_BASE_URL || "https://scout-engine-production.up.railway.app"),

  /**
   * Enable/disable API integration globally
   */
  ENABLED: true,

  /**
   * Auto-fetch on component mount
   */
  AUTO_FETCH: true,

  /**
   * Request timeout in milliseconds
   */
  TIMEOUT: 30000,

  /**
   * Retry configuration
   */
  RETRY: {
    enabled: false,
    maxAttempts: 3,
    delayMs: 1000,
  },

  /**
   * Cache configuration
   */
  CACHE: {
    enabled: false,
    ttlMs: 5 * 60 * 1000,
  },

  /**
   * Debug mode - logs all API requests/responses
   */
  DEBUG: true,
};

export const API_FEATURES = {
  PLAYERS_LIST: true,
  PLAYER_DETAILS: true,
  PLAYER_SEARCH: true,
  COMPARISON: true,
  WATCHLIST: true,
  ALERTS: false,
  REPORTS: false,
  SIMULATION: false,
  TEAM_ANALYSIS: false,
};

export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

export const API_MESSAGES = {
  LOADING: {
    pt: "Carregando dados...",
    en: "Loading data...",
    es: "Cargando datos...",
    de: "Daten werden geladen...",
  },
  ERROR: {
    pt: "Erro ao carregar dados",
    en: "Error loading data",
    es: "Error al cargar datos",
    de: "Fehler beim Laden der Daten",
  },
  NO_DATA: {
    pt: "Nenhum dado disponivel",
    en: "No data available",
    es: "No hay datos disponibles",
    de: "Keine Daten verfugbar",
  },
  CORS_ERROR: {
    pt: "Erro de CORS - Configure o backend",
    en: "CORS error - Configure backend",
    es: "Error CORS - Configure el backend",
    de: "CORS-Fehler - Backend konfigurieren",
  },
  NETWORK_ERROR: {
    pt: "Erro de rede - Verifique sua conexao",
    en: "Network error - Check your connection",
    es: "Error de red - Verifique su conexion",
    de: "Netzwerkfehler - Uberprufen Sie Ihre Verbindung",
  },
};

export function getApiMessage(
  key: keyof typeof API_MESSAGES,
  language: "pt" | "en" | "es" | "de" = "pt"
): string {
  return API_MESSAGES[key][language];
}

export function isApiEnabled(feature?: keyof typeof API_FEATURES): boolean {
  if (!API_CONFIG.ENABLED) return false;
  if (!feature) return true;
  return API_FEATURES[feature];
}

export function shouldAutoFetch(override?: boolean): boolean {
  if (override !== undefined) return override;
  return API_CONFIG.AUTO_FETCH && API_CONFIG.ENABLED;
}

export function logApiActivity(
  type: "request" | "response" | "error",
  endpoint: string,
  data?: any
) {
  if (!API_CONFIG.DEBUG) return;

  const timestamp = new Date().toISOString();
  const prefix = `[API ${type.toUpperCase()}]`;

  switch (type) {
    case "request":
      console.log(`${prefix} ${endpoint}`, { timestamp });
      break;
    case "response":
      console.log(`${prefix} ${endpoint}`, { timestamp, data });
      break;
    case "error":
      console.error(`${prefix} ${endpoint}`, { timestamp, error: data });
      break;
  }
}

export const MIGRATION = {
  getDataSourceLabel(isApiData: boolean): string {
    return isApiData ? "API (Real Data)" : "Mock Data";
  },

  getDataSourceColor(isApiData: boolean): string {
    return isApiData ? "#00FF9C" : "#7A5CFF";
  },

  shouldShowDataSource(): boolean {
    return API_CONFIG.DEBUG || ENV.isDevelopment;
  },
};

export const PERFORMANCE = {
  enabled: ENV.isDevelopment,

  logApiCall(endpoint: string, duration: number) {
    if (!this.enabled) return;
    console.log(`[PERF] ${endpoint}: ${duration}ms`);
  },

  startTimer() {
    return performance.now();
  },

  endTimer(start: number): number {
    return performance.now() - start;
  },
};
