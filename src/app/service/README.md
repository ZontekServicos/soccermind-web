# Soccer Mind API Integration

## Overview

This directory contains the complete API integration layer for Soccer Mind platform.

## Files

- **api.ts**: API client and endpoint functions
- **mappers.ts**: Data transformation layer (API → Frontend)
- **useApi.ts** (hooks): React hooks for consuming API endpoints

## Quick Start

### Basic Usage with Hooks

```tsx
import { usePlayers } from "../hooks/useApi";

function PlayersList() {
  // Auto-fetch is disabled by default for CORS safety
  const { data, loading, error, refetch } = usePlayers(1, 20, false);

  // Manually trigger fetch
  useEffect(() => {
    refetch();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.map(player => (
        <div key={player.id}>{player.name}</div>
      ))}
    </div>
  );
}
```

### Using API Functions Directly

```tsx
import * as api from "../service/api";
import { mapApiPlayersToPlayers } from "../service/mappers";

async function loadPlayers() {
  const response = await api.getPlayers(1, 20);
  
  if (response.success) {
    const players = mapApiPlayersToPlayers(response.data);
    // Use transformed players
  } else {
    console.error(response.error);
  }
}
```

## Available Hooks

### Players
- `usePlayers(page, limit, autoFetch)` - List players with pagination
- `usePlayerSearch(params, autoFetch)` - Search players with filters
- `usePlayer(id, autoFetch)` - Get single player details
- `usePlayerProjection(id, autoFetch)` - Get player projection
- `useSimilarPlayers(id, autoFetch)` - Get similar players
- `usePlayerNotes(id, autoFetch)` - Get player notes

### Comparison
- `useComparison(idA, idB, autoFetch)` - Compare two players by ID
- `useComparisonByName(nameA, nameB, autoFetch)` - Compare by name

### Watchlist
- `useWatchlist(autoFetch)` - Get watchlist with add/remove methods

### Others
- `useAlerts(autoFetch)` - Get alerts
- `useTeamAnalysis(params, autoFetch)` - Get team analysis
- `useTransferSimulation()` - Transfer simulation (manual trigger)
- `useExplainabilityReport(id, autoFetch)` - Get AI explainability

## API Response Format

All API responses follow this envelope pattern:

```typescript
{
  success: boolean;
  data: T;
  error: string | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

## Data Mapping

The `mappers.ts` file transforms API data into frontend-friendly structures:

### Player Mapping

```typescript
// API Player (backend)
{
  id: string;
  name: string;
  overall: number;
  // ... minimal backend fields
}

// PlayerExtended (frontend)
{
  name: string;
  position: string;
  overallRating: number;
  tier: "ELITE" | "PREMIUM" | "STANDARD" | "PROSPECT";
  capitalEfficiency: number;
  structuralRisk: { ... };
  liquidity: { ... };
  // ... enriched frontend fields
}
```

## Important Notes

### CORS Configuration

⚠️ **Auto-fetch is disabled by default** due to CORS restrictions on the backend.

To enable auto-fetch once CORS is configured:
```tsx
const { data } = usePlayers(1, 20, true); // true = auto-fetch
```

### Error Handling

All hooks return:
- `loading`: boolean
- `error`: string | null
- `data`: T | null
- `refetch()`: method to reload data

### Data Transformation

Always use mappers when working with raw API data:

```tsx
import { mapApiPlayerToPlayer } from "../service/mappers";

const apiPlayer = await getPlayer(id);
const frontendPlayer = mapApiPlayerToPlayer(apiPlayer.data);
```

## Environment

- **Production API**: `https://scout-engine-production.up.railway.app/api`
- **OpenAPI Docs**: `/api/docs/openapi.json`
- **Health Check**: `/api/health`

## Migration Guide

### From Mock Data to Real API

1. Import the hook instead of mock data:
```tsx
// Before
import { players } from "../data/players";

// After
import { usePlayers } from "../hooks/useApi";
const { data: players, loading, error, refetch } = usePlayers(1, 20, false);
```

2. Handle loading and error states
3. Trigger refetch when needed
4. Data structure remains compatible (thanks to mappers!)

## Examples

### Search Players

```tsx
const { data, loading, refetch } = usePlayerSearch({
  position: "ST",
  minAge: 21,
  maxAge: 28,
  minOverall: 80
}, false);
```

### Compare Players

```tsx
const { data, loading } = useComparison("player1-id", "player2-id", false);

// Access comparison data
if (data) {
  console.log(data.playerA);
  console.log(data.playerB);
  console.log(data.comparison);
}
```

### Watchlist Management

```tsx
const { data, addPlayer, removePlayer } = useWatchlist(false);

// Add to watchlist
await addPlayer("player-id");

// Remove from watchlist
await removePlayer("watchlist-item-id");
```

## Testing

To test if the API is reachable:

```tsx
import { checkHealth } from "../service/api";

const response = await checkHealth();
console.log(response.success); // true if backend is up
```
