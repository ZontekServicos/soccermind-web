export type DataSourceMode = "api" | "mock";

export type DataDomain =
  | "players"
  | "dashboard"
  | "compare"
  | "reports"
  | "ranking"
  | "history"
  | "governance"
  | "serviceDesk"
  | "profile"
  | "squad";

const ENV_DATA_SOURCE = (import.meta.env.VITE_DATA_SOURCE as string | undefined)?.trim().toLowerCase();

const DEFAULT_DATA_SOURCE_BY_DOMAIN: Record<DataDomain, DataSourceMode> = {
  players: "api",
  dashboard: "api",
  compare: "api",
  reports: "api",
  ranking: "api",
  history: "api",
  governance: "mock",
  serviceDesk: "mock",
  profile: "mock",
  squad: "mock",
};

function normalizeDataSource(value: string | undefined): DataSourceMode | null {
  if (value === "api" || value === "mock") {
    return value;
  }

  return null;
}

export const DATA_SOURCE_CONFIG = {
  globalMode: normalizeDataSource(ENV_DATA_SOURCE),
  byDomain: DEFAULT_DATA_SOURCE_BY_DOMAIN,
};

export function getDataSource(domain: DataDomain): DataSourceMode {
  return DATA_SOURCE_CONFIG.globalMode ?? DATA_SOURCE_CONFIG.byDomain[domain];
}

export function shouldUseMockData(domain: DataDomain) {
  return getDataSource(domain) === "mock";
}
