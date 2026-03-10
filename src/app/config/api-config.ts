/**
 * Soccer Mind API Configuration
 * Centralized configuration for API integration
 */

export const API_CONFIG = {
  /**
   * Base URL for the backend API
   */
  BASE_URL: "https://scout-engine-production.up.railway.app",

  /**
   * Enable/disable API integration globally
   * Set to false to use mock data only
   * Set to true to use real API (requires CORS configuration)
   */
  ENABLED: true,

  /**
   * Auto-fetch on component mount
   * Set to false to manually trigger fetches (safer for CORS issues)
   * Set to true for automatic data loading
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
    ttlMs: 5 * 60 * 1000, // 5 minutes
  },

  /**
   * Debug mode - logs all API requests/responses
   */
  DEBUG: true,
};

/**
 * Feature flags for gradual rollout
 */
export const API_FEATURES = {
  /**
   * Enable API for players list
   */
  PLAYERS_LIST: true,

  /**
   * Enable API for player details
   */
  PLAYER_DETAILS: true,

  /**
   * Enable API for player search
   */
  PLAYER_SEARCH: true,

  /**
   * Enable API for comparison
   */
  COMPARISON: true,

  /**
   * Enable API for watchlist
   */
  WATCHLIST: true,

  /**
   * Enable API for alerts
   */
  ALERTS: false,

  /**
   * Enable API for reports
   */
  REPORTS: false,

  /**
   * Enable API for transfer simulation
   */
  SIMULATION: false,

  /**
   * Enable API for team analysis
   */
  TEAM_ANALYSIS: false,
};

/**
 * Environment detection
 */
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

/**
 * API Status Messages (i18n ready)
 */
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
    pt: "Nenhum dado disponível",
    en: "No data available",
    es: "No hay datos disponibles",
    de: "Keine Daten verfügbar",
  },
  CORS_ERROR: {
    pt: "Erro de CORS - Configure o backend",
    en: "CORS error - Configure backend",
    es: "Error CORS - Configure el backend",
    de: "CORS-Fehler - Backend konfigurieren",
  },
  NETWORK_ERROR: {
    pt: "Erro de rede - Verifique sua conexão",
    en: "Network error - Check your connection",
    es: "Error de red - Verifique su conexión",
    de: "Netzwerkfehler - Überprüfen Sie Ihre Verbindung",
  },
};

/**
 * Helper to get API message in current language
 */
export function getApiMessage(
  key: keyof typeof API_MESSAGES,
  language: "pt" | "en" | "es" | "de" = "pt"
): string {
  return API_MESSAGES[key][language];
}

/**
 * Check if API is enabled for a specific feature
 */
export function isApiEnabled(feature?: keyof typeof API_FEATURES): boolean {
  if (!API_CONFIG.ENABLED) return false;
  if (!feature) return true;
  return API_FEATURES[feature];
}

/**
 * Get effective auto-fetch setting
 */
export function shouldAutoFetch(override?: boolean): boolean {
  if (override !== undefined) return override;
  return API_CONFIG.AUTO_FETCH && API_CONFIG.ENABLED;
}

/**
 * Log API activity (only if DEBUG enabled)
 */
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

/**
 * Migration helpers
 */
export const MIGRATION = {
  /**
   * Get data source label for UI
   */
  getDataSourceLabel(isApiData: boolean): string {
    return isApiData ? "API (Real Data)" : "Mock Data";
  },

  /**
   * Get data source badge color
   */
  getDataSourceColor(isApiData: boolean): string {
    return isApiData ? "#00FF9C" : "#7A5CFF";
  },

  /**
   * Check if should show data source indicator
   */
  shouldShowDataSource(): boolean {
    return API_CONFIG.DEBUG || ENV.isDevelopment;
  },
};

/**
 * Performance monitoring
 */
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
