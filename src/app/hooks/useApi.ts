/**
 * Soccer Mind API Hooks
 * Custom hooks for consuming the backend API with loading/error states
 */

import { useState, useEffect, useCallback } from "react";
import * as api from "../service/api";
import type { ApiResponse } from "../service/api";

// ========================================
// Generic API Hook
// ========================================

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  meta?: api.PaginationMeta;
}

interface UseApiOptions {
  autoFetch?: boolean;
  dependencies?: any[];
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void> } {
  const { autoFetch = true, dependencies = [] } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: autoFetch,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall();

      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          meta: response.meta,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [apiCall]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [...dependencies, autoFetch]);

  return {
    ...state,
    refetch: fetchData,
  };
}

// ========================================
// Players Hooks
// ========================================

export function usePlayers(page: number = 1, limit: number = 20, autoFetch: boolean = false) {
  return useApi(() => api.getPlayers(page, limit), {
    autoFetch,
    dependencies: [page, limit],
  });
}

export function usePlayerSearch(
  params: Parameters<typeof api.searchPlayers>[0],
  autoFetch: boolean = false
) {
  return useApi(() => api.searchPlayers(params), {
    autoFetch,
    dependencies: [JSON.stringify(params)],
  });
}

export function usePlayer(id: string, autoFetch: boolean = false) {
  return useApi(() => api.getPlayer(id), {
    autoFetch,
    dependencies: [id],
  });
}

export function usePlayerProjection(id: string, autoFetch: boolean = false) {
  return useApi(() => api.getPlayerProjection(id), {
    autoFetch,
    dependencies: [id],
  });
}

export function useSimilarPlayers(id: string, autoFetch: boolean = false) {
  return useApi(() => api.getSimilarPlayers(id), {
    autoFetch,
    dependencies: [id],
  });
}

export function usePlayerNotes(id: string, autoFetch: boolean = false) {
  return useApi(() => api.getPlayerNotes(id), {
    autoFetch,
    dependencies: [id],
  });
}

// ========================================
// Comparison Hook
// ========================================

export function useComparison(idA: string, idB: string, autoFetch: boolean = false) {
  return useApi(() => api.comparePlayers(idA, idB), {
    autoFetch,
    dependencies: [idA, idB],
  });
}

export function useComparisonByName(
  nameA: string,
  nameB: string,
  autoFetch: boolean = false
) {
  return useApi(() => api.comparePlayersByName(nameA, nameB), {
    autoFetch,
    dependencies: [nameA, nameB],
  });
}

// ========================================
// Watchlist Hooks
// ========================================

export function useWatchlist(autoFetch: boolean = false) {
  const result = useApi(() => api.getWatchlist(), { autoFetch });

  const addPlayer = useCallback(
    async (playerId: string) => {
      const response = await api.addToWatchlist(playerId);
      if (response.success) {
        await result.refetch();
      }
      return response;
    },
    [result]
  );

  const removePlayer = useCallback(
    async (id: string) => {
      const response = await api.removeFromWatchlist(id);
      if (response.success) {
        await result.refetch();
      }
      return response;
    },
    [result]
  );

  return {
    ...result,
    addPlayer,
    removePlayer,
  };
}

// ========================================
// Alerts Hook
// ========================================

export function useAlerts(autoFetch: boolean = false) {
  return useApi(() => api.getAlerts(), { autoFetch });
}

// ========================================
// Reports Hook
// ========================================

export function useExplainabilityReport(id: string, autoFetch: boolean = false) {
  return useApi(() => api.getExplainabilityReport(id), {
    autoFetch,
    dependencies: [id],
  });
}

// ========================================
// Team Analysis Hook
// ========================================

export function useTeamAnalysis(
  params?: Parameters<typeof api.getTeamAnalysis>[0],
  autoFetch: boolean = false
) {
  return useApi(() => api.getTeamAnalysis(params), {
    autoFetch,
    dependencies: [JSON.stringify(params)],
  });
}

// ========================================
// Transfer Simulation Hook
// ========================================

export function useTransferSimulation() {
  const [state, setState] = useState<UseApiState<api.ApiTransferSimulation>>({
    data: null,
    loading: false,
    error: null,
  });

  const simulate = useCallback(
    async (payload: Parameters<typeof api.simulateTransfer>[0]) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await api.simulateTransfer(payload);

        if (response.success) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error || "Simulation failed",
          });
        }

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        return {
          success: false,
          data: null as any,
          error: errorMessage,
        };
      }
    },
    []
  );

  return {
    ...state,
    simulate,
  };
}

// ========================================
// Health Check Hook
// ========================================

export function useHealthCheck(autoFetch: boolean = false) {
  return useApi(() => api.checkHealth(), { autoFetch });
}
