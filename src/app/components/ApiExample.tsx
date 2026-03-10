/**
 * Soccer Mind API Integration Example
 * 
 * This component demonstrates how to:
 * 1. Use API hooks
 * 2. Handle loading/error states
 * 3. Transform API data with mappers
 * 4. Integrate with existing UI components
 */

import { useState, useEffect } from "react";
import { usePlayers, usePlayer, useComparison, useWatchlist } from "../hooks/useApi";
import { mapApiPlayersToPlayers, mapApiPlayerToPlayer } from "../service/mappers";
import { Button } from "./ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Example 1: Players List with Pagination
 */
export function PlayersListExample() {
  const [page, setPage] = useState(1);
  const { data: apiPlayers, loading, error, refetch, meta } = usePlayers(page, 20, false);

  // Transform API data to frontend format
  const players = apiPlayers ? mapApiPlayersToPlayers(apiPlayers) : [];

  useEffect(() => {
    // Manually trigger fetch when component mounts
    refetch();
  }, [page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#00C2FF]" />
        <span className="ml-2">Loading players...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-[#FF4D4F] mb-4" />
        <h3 className="text-xl font-semibold mb-2">API Error</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Players List</h2>
      
      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <div
            key={`${player.name}-${player.club}`}
            className="bg-[rgba(255,255,255,0.02)] p-4 rounded-lg"
          >
            <h3 className="font-semibold">{player.name}</h3>
            <p className="text-sm text-gray-400">
              {player.position} • {player.club}
            </p>
            <p className="text-xs text-gray-500">
              Overall: {player.overallRating} • Age: {player.age}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {meta && (
        <div className="flex justify-between items-center pt-4">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-400">
            Page {meta.page} of {meta.totalPages} ({meta.total} total players)
          </span>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= meta.totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Single Player Details
 */
export function PlayerDetailsExample({ playerId }: { playerId: string }) {
  const { data: apiPlayer, loading, error, refetch } = usePlayer(playerId, false);

  // Transform to frontend format
  const player = apiPlayer ? mapApiPlayerToPlayer(apiPlayer) : null;

  useEffect(() => {
    if (playerId) {
      refetch();
    }
  }, [playerId]);

  if (loading) return <div>Loading player details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!player) return <div>Player not found</div>;

  return (
    <div className="bg-[rgba(255,255,255,0.02)] p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">{player.name}</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Position</p>
          <p className="font-semibold">{player.position}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Club</p>
          <p className="font-semibold">{player.club}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Overall Rating</p>
          <p className="font-semibold text-[#00C2FF]">{player.overallRating}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Market Value</p>
          <p className="font-semibold text-[#00FF9C]">{player.marketValue}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Capital Efficiency</p>
          <p className="font-semibold">{player.capitalEfficiency.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Risk Level</p>
          <p className={`font-semibold ${
            player.riskLevel === "LOW" ? "text-[#00FF9C]" :
            player.riskLevel === "MEDIUM" ? "text-[#00C2FF]" :
            "text-[#FF4D4F]"
          }`}>
            {player.riskLevel}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: Player Comparison
 */
export function ComparisonExample({
  playerAId,
  playerBId,
}: {
  playerAId: string;
  playerBId: string;
}) {
  const { data, loading, error, refetch } = useComparison(
    playerAId,
    playerBId,
    false
  );

  useEffect(() => {
    if (playerAId && playerBId) {
      refetch();
    }
  }, [playerAId, playerBId]);

  if (loading) return <div>Loading comparison...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No comparison data</div>;

  const playerA = mapApiPlayerToPlayer(data.playerA);
  const playerB = mapApiPlayerToPlayer(data.playerB);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Player A */}
      <div className="bg-[rgba(255,255,255,0.02)] p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">{playerA.name}</h3>
        <div className="space-y-2">
          <p>Overall: {playerA.overallRating}</p>
          <p>Position: {playerA.position}</p>
          <p>Age: {playerA.age}</p>
          <p>Capital Efficiency: {playerA.capitalEfficiency.toFixed(1)}</p>
        </div>
      </div>

      {/* Player B */}
      <div className="bg-[rgba(255,255,255,0.02)] p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">{playerB.name}</h3>
        <div className="space-y-2">
          <p>Overall: {playerB.overallRating}</p>
          <p>Position: {playerB.position}</p>
          <p>Age: {playerB.age}</p>
          <p>Capital Efficiency: {playerB.capitalEfficiency.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 4: Watchlist Management
 */
export function WatchlistExample() {
  const { data: watchlist, loading, error, addPlayer, removePlayer } = useWatchlist(false);
  const [newPlayerId, setNewPlayerId] = useState("");

  const handleAddPlayer = async () => {
    if (newPlayerId.trim()) {
      const response = await addPlayer(newPlayerId);
      if (response.success) {
        setNewPlayerId("");
        alert("Player added to watchlist!");
      } else {
        alert(`Error: ${response.error}`);
      }
    }
  };

  const handleRemovePlayer = async (id: string) => {
    const response = await removePlayer(id);
    if (response.success) {
      alert("Player removed from watchlist!");
    } else {
      alert(`Error: ${response.error}`);
    }
  };

  if (loading) return <div>Loading watchlist...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Watchlist</h2>

      {/* Add Player */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newPlayerId}
          onChange={(e) => setNewPlayerId(e.target.value)}
          placeholder="Enter player ID"
          className="flex-1 px-4 py-2 bg-[rgba(255,255,255,0.05)] rounded border border-gray-700"
        />
        <Button onClick={handleAddPlayer}>Add to Watchlist</Button>
      </div>

      {/* Watchlist Items */}
      <div className="space-y-2">
        {watchlist?.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.02)] rounded-lg"
          >
            <div>
              <p className="font-semibold">{item.player.name}</p>
              <p className="text-sm text-gray-400">
                {item.player.position} • {item.player.team}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleRemovePlayer(item.id)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 5: API Status Check
 */
export function ApiStatusExample() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = async () => {
    setStatus("checking");
    try {
      const { checkHealth } = await import("../service/api");
      const response = await checkHealth();
      setStatus(response.success ? "online" : "offline");
      setLastCheck(new Date());
    } catch {
      setStatus("offline");
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="flex items-center gap-3 p-4 bg-[rgba(255,255,255,0.02)] rounded-lg">
      <div
        className={`w-3 h-3 rounded-full ${
          status === "checking"
            ? "bg-yellow-500 animate-pulse"
            : status === "online"
            ? "bg-[#00FF9C]"
            : "bg-[#FF4D4F]"
        }`}
      />
      <div className="flex-1">
        <p className="font-semibold">
          API Status: {status === "checking" ? "Checking..." : status.toUpperCase()}
        </p>
        {lastCheck && (
          <p className="text-xs text-gray-400">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        )}
      </div>
      <Button onClick={checkStatus} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4" />
      </Button>
    </div>
  );
}
