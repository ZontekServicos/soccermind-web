/**
 * Soccer Mind API Service
 * Base URL: https://scout-engine-production.up.railway.app
 * 
 * All responses follow the envelope pattern:
 * { success: boolean, data: any, error: string | null, meta?: object }
 */

import { API_CONFIG, logApiActivity, PERFORMANCE } from "../config/api-config";

const API_BASE_URL = `${API_CONFIG.BASE_URL}/api`;

// ========================================
// Types
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error: string | null;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiPlayer {
  id: string;
  name: string;
  position: string | null;
  positions: string[];
  team: string | null;
  league: string | null;
  nationality: string;
  age: number;
  overall: number | null;
  potential: number | null;
  marketValue: number | null;
  image: string | null;
  attributes?: Record<string, any>;
}

export interface ApiComparison {
  playerA: ApiPlayer;
  playerB: ApiPlayer;
  comparison: {
    overall: any;
    attributes: any;
    risk?: any;
    financial?: any;
    scouting?: any;
  };
}

export interface ApiProjection {
  playerId: string;
  projections: any[];
  growth?: any;
  development?: any;
}

export interface ApiNote {
  id: string;
  playerId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiWatchlistItem {
  id: string;
  player: ApiPlayer;
  addedAt: string;
}

export interface ApiAlert {
  id: string;
  type: "opportunity" | "risk" | "noteworthy";
  title: string;
  description: string;
  playerId?: string;
  player?: ApiPlayer;
  createdAt: string;
}

export interface ApiTransferSimulation {
  impact: any;
  fit: any;
  recommendation: string;
  risk: any;
}

export interface ApiExplainability {
  playerId: string;
  explanation: string;
  narrative: string;
  blocks: any[];
  reasoning: any;
}

// ========================================
// API Client
// ========================================

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          data: null as any,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

const client = new ApiClient(API_BASE_URL);

// ========================================
// Health
// ========================================

export async function checkHealth() {
  return client.get("/health");
}

// ========================================
// Players
// ========================================

export async function getPlayers(page: number = 1, limit: number = 20) {
  return client.get<ApiPlayer[]>(`/players?page=${page}&limit=${limit}`);
}

export async function searchPlayers(params: {
  query?: string;
  position?: string;
  team?: string;
  league?: string;
  minAge?: number;
  maxAge?: number;
  minOverall?: number;
  maxOverall?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params.query) searchParams.set("query", params.query);
  if (params.position) searchParams.set("position", params.position);
  if (params.team) searchParams.set("team", params.team);
  if (params.league) searchParams.set("league", params.league);
  if (params.minAge !== undefined) searchParams.set("minAge", params.minAge.toString());
  if (params.maxAge !== undefined) searchParams.set("maxAge", params.maxAge.toString());
  if (params.minOverall !== undefined) searchParams.set("minOverall", params.minOverall.toString());
  if (params.maxOverall !== undefined) searchParams.set("maxOverall", params.maxOverall.toString());

  return client.get<ApiPlayer[]>(`/players/search?${searchParams.toString()}`);
}

export async function getPlayer(id: string) {
  return client.get<ApiPlayer>(`/player/${id}`);
}

export async function getPlayerProjection(id: string) {
  return client.get<ApiProjection>(`/player/${id}/projection`);
}

export async function getSimilarPlayers(id: string) {
  return client.get<ApiPlayer[]>(`/player/${id}/similar`);
}

export async function getPlayerNotes(id: string) {
  return client.get<ApiNote[]>(`/player/${id}/notes`);
}

export async function addPlayerNote(id: string, content: string) {
  return client.post<ApiNote>(`/player/${id}/notes`, { content });
}

// ========================================
// Comparison
// ========================================

export async function comparePlayers(idA: string, idB: string) {
  return client.get<ApiComparison>(`/compare/${idA}/${idB}`);
}

export async function comparePlayersByName(nameA: string, nameB: string) {
  return client.get<ApiComparison>(`/compare/by-name/${nameA}/${nameB}`);
}

// ========================================
// Watchlist
// ========================================

export async function getWatchlist() {
  return client.get<ApiWatchlistItem[]>("/watchlist");
}

export async function addToWatchlist(playerId: string) {
  return client.post<ApiWatchlistItem>("/watchlist", { playerId });
}

export async function removeFromWatchlist(id: string) {
  return client.delete(`/watchlist/${id}`);
}

// ========================================
// Alerts
// ========================================

export async function getAlerts() {
  return client.get<ApiAlert[]>("/alerts");
}

// ========================================
// Reports
// ========================================

export async function getExplainabilityReport(id: string) {
  return client.get<ApiExplainability>(`/reports/${id}/explainability`);
}

// ========================================
// Simulation
// ========================================

export async function simulateTransfer(payload: {
  playerId: string;
  targetTeam: string;
  transferFee?: number;
  salary?: number;
  duration?: number;
}) {
  return client.post<ApiTransferSimulation>("/simulation/transfer", payload);
}

// ========================================
// Team Analysis
// ========================================

export async function getTeamAnalysis(params?: {
  teamId?: string;
  teamName?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.teamId) searchParams.set("teamId", params.teamId);
  if (params?.teamName) searchParams.set("teamName", params.teamName);
  
  const query = searchParams.toString();
  return client.get<any>(`/team/analysis${query ? `?${query}` : ""}`);
}

// ========================================
// Validation
// ========================================

export async function validateModel(payload: any) {
  return client.post<any>("/validation/model", payload);
}

// ========================================
// Legacy compatibility (keep for backward compatibility)
// ========================================

export async function getRanking(position: string) {
  // Map to new search endpoint
  return searchPlayers({ position, minOverall: 75 });
}

export async function getScout() {
  // Map to alerts endpoint
  return getAlerts();
}
