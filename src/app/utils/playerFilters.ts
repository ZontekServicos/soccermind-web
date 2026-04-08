import type { PlayersFiltersParams } from "../services/players";
import { positionLabel } from "./positions";

export interface PlayersFiltersState {
  search: string;
  positions: string[];
  nationality: string;
  team: string;
  league: string;
  source: string;
  minAge: string;
  maxAge: string;
  minOverall: string;
  maxOverall: string;
  minPotential: string;
  maxPotential: string;
  minValue: string;
  maxValue: string;
}

export type FilterFieldKey = keyof Omit<PlayersFiltersState, "positions" | "search">;

export interface ActivePlayerFilterDescriptor {
  key: string;
  label: string;
  kind: "search" | "position" | "field" | "range";
  field?: FilterFieldKey;
  fields?: [FilterFieldKey, FilterFieldKey];
  position?: string;
}

export const DEFAULT_PLAYERS_FILTERS: PlayersFiltersState = {
  search: "",
  positions: [],
  nationality: "",
  team: "",
  league: "",
  source: "",
  minAge: "",
  maxAge: "",
  minOverall: "",
  maxOverall: "",
  minPotential: "",
  maxPotential: "",
  minValue: "",
  maxValue: "",
};

export function parseFiltersFromSearchParams(searchParams: URLSearchParams): PlayersFiltersState {
  const positions = (searchParams.get("positions") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    search: searchParams.get("search") ?? "",
    positions,
    nationality: searchParams.get("nationality") ?? "",
    team: searchParams.get("team") ?? "",
    league: searchParams.get("league") ?? "",
    source: searchParams.get("source") ?? "",
    minAge: searchParams.get("minAge") ?? "",
    maxAge: searchParams.get("maxAge") ?? "",
    minOverall: searchParams.get("minOverall") ?? "",
    maxOverall: searchParams.get("maxOverall") ?? "",
    minPotential: searchParams.get("minPotential") ?? "",
    maxPotential: searchParams.get("maxPotential") ?? "",
    minValue: searchParams.get("minValue") ?? "",
    maxValue: searchParams.get("maxValue") ?? "",
  };
}

export function countActiveFilters(filters: PlayersFiltersState) {
  let count = filters.positions.length;

  Object.entries(filters).forEach(([key, value]) => {
    if (key === "positions") {
      return;
    }

    if (typeof value === "string" && value.trim()) {
      count += 1;
    }
  });

  return count;
}

export function buildApiFilters(filters: PlayersFiltersState, debouncedSearch: string): PlayersFiltersParams {
  return {
    search: debouncedSearch || undefined,
    positions: filters.positions.length > 0 ? filters.positions : undefined,
    nationality: filters.nationality || undefined,
    team: filters.team || undefined,
    league: filters.league || undefined,
    source: filters.source || undefined,
    minAge: filters.minAge || undefined,
    maxAge: filters.maxAge || undefined,
    minOverall: filters.minOverall || undefined,
    maxOverall: filters.maxOverall || undefined,
    minPotential: filters.minPotential || undefined,
    maxPotential: filters.maxPotential || undefined,
    minValue: filters.minValue || undefined,
    maxValue: filters.maxValue || undefined,
  };
}

export function buildRangeLabel(label: string, minValue: string, maxValue: string) {
  if (minValue && maxValue) {
    return `${label}: ${minValue} - ${maxValue}`;
  }

  if (minValue) {
    return `${label}: >= ${minValue}`;
  }

  if (maxValue) {
    return `${label}: <= ${maxValue}`;
  }

  return "";
}

export function getActivePlayerFilterDescriptors(filters: PlayersFiltersState): ActivePlayerFilterDescriptor[] {
  const descriptors: ActivePlayerFilterDescriptor[] = [];

  if (filters.search) {
    descriptors.push({
      key: "search",
      label: `Busca: ${filters.search}`,
      kind: "search",
    });
  }

  filters.positions.forEach((position) => {
    descriptors.push({
      key: `position-${position}`,
      label: `Posição: ${positionLabel(position)}`,
      kind: "position",
      position,
    });
  });

  [
    ["nationality", filters.nationality, "Nacionalidade"],
    ["team", filters.team, "Clube"],
    ["league", filters.league, "Liga"],
    ["source", filters.source, "Source"],
  ].forEach(([key, value, label]) => {
    if (typeof value === "string" && value) {
      descriptors.push({
        key: String(key),
        label: `${label}: ${value}`,
        kind: "field",
        field: key as FilterFieldKey,
      });
    }
  });

  [
    ["age", buildRangeLabel("Idade", filters.minAge, filters.maxAge), ["minAge", "maxAge"]],
    ["overall", buildRangeLabel("Overall", filters.minOverall, filters.maxOverall), ["minOverall", "maxOverall"]],
    ["potential", buildRangeLabel("Potential", filters.minPotential, filters.maxPotential), ["minPotential", "maxPotential"]],
    ["value", buildRangeLabel("Valor", filters.minValue, filters.maxValue), ["minValue", "maxValue"]],
  ].forEach(([key, label, fields]) => {
    if (typeof label === "string" && label) {
      descriptors.push({
        key: String(key),
        label,
        kind: "range",
        fields: fields as [FilterFieldKey, FilterFieldKey],
      });
    }
  });

  return descriptors;
}
