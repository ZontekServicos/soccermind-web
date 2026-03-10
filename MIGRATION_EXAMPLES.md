# Soccer Mind - Exemplos Práticos de Migração

## 📚 Índice

1. [Dashboard - Métricas Agregadas](#dashboard)
2. [Players List - Lista com Paginação](#players-list)
3. [Player Profile - Detalhes do Jogador](#player-profile)
4. [Compare - Comparação de Jogadores](#compare)
5. [Reports - Relatórios](#reports)

---

## 🎯 Dashboard

### Antes (Mock Data)

```tsx
import { mockPlayers } from "../data/mockPlayers";

export default function Dashboard() {
  const highRiskPlayers = mockPlayers.filter((p) => p.riskLevel === "HIGH");
  const topEfficiencyPlayers = [...mockPlayers]
    .sort((a, b) => b.capitalEfficiency - a.capitalEfficiency)
    .slice(0, 3);
  const averageEfficiency = 
    mockPlayers.reduce((sum, p) => sum + p.capitalEfficiency, 0) / mockPlayers.length;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Average Efficiency: {averageEfficiency.toFixed(1)}</p>
      {/* ... more content */}
    </div>
  );
}
```

### Depois (API Integration)

```tsx
import { usePlayers } from "../hooks/useApi";
import { mapApiPlayersToPlayers } from "../service/mappers";
import { useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { data: apiPlayers, loading, error, refetch } = usePlayers(1, 100, false);
  
  // Transform API data
  const players = apiPlayers ? mapApiPlayersToPlayers(apiPlayers) : [];

  // Manual fetch on mount
  useEffect(() => {
    refetch();
  }, []);

  // Calculate metrics (same logic as before)
  const highRiskPlayers = players.filter((p) => p.riskLevel === "HIGH");
  const topEfficiencyPlayers = [...players]
    .sort((a, b) => b.capitalEfficiency - a.capitalEfficiency)
    .slice(0, 3);
  const averageEfficiency = 
    players.length > 0 
      ? players.reduce((sum, p) => sum + p.capitalEfficiency, 0) / players.length 
      : 0;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#00C2FF]" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-12 h-12 text-[#FF4D4F] mb-4" />
        <h3 className="text-xl font-semibold mb-2">Erro ao Carregar Dados</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={() => refetch()}>Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Average Efficiency: {averageEfficiency.toFixed(1)}</p>
      {/* ... rest of content (unchanged) */}
    </div>
  );
}
```

### 🎯 Key Changes

- ✅ Import `usePlayers` hook
- ✅ Import `mapApiPlayersToPlayers` mapper
- ✅ Add loading/error states
- ✅ Transform API data before use
- ✅ Rest of logic remains IDENTICAL

---

## 📋 Players List

### Antes (Mock Data)

```tsx
import { mockPlayers } from "../data/mockPlayers";

export default function PlayersList() {
  return (
    <div>
      <h1>Players</h1>
      <div className="grid grid-cols-3 gap-4">
        {mockPlayers.map((player) => (
          <div key={player.name}>
            <h3>{player.name}</h3>
            <p>{player.position} • {player.club}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Depois (API Integration com Paginação)

```tsx
import { useState, useEffect } from "react";
import { usePlayers } from "../hooks/useApi";
import { mapApiPlayersToPlayers } from "../service/mappers";
import { Button } from "../components/ui/button";

export default function PlayersList() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: apiPlayers, loading, error, refetch, meta } = usePlayers(
    page,
    limit,
    false
  );

  const players = apiPlayers ? mapApiPlayersToPlayers(apiPlayers) : [];

  // Fetch when page changes
  useEffect(() => {
    refetch();
  }, [page]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Players</h1>
        {meta && (
          <p className="text-sm text-gray-400">
            Showing {players.length} of {meta.total} players
          </p>
        )}
      </div>

      {/* Player Grid (unchanged) */}
      <div className="grid grid-cols-3 gap-4">
        {players.map((player) => (
          <div key={player.name}>
            <h3>{player.name}</h3>
            <p>{player.position} • {player.club}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {meta && (
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## 👤 Player Profile

### Antes (Mock Data)

```tsx
import { mockPlayers } from "../data/mockPlayers";
import { useParams } from "react-router";

export default function PlayerProfile() {
  const { id } = useParams();
  const player = mockPlayers.find((p) => p.name === id);

  if (!player) return <div>Player not found</div>;

  return (
    <div>
      <h1>{player.name}</h1>
      <p>Position: {player.position}</p>
      <p>Overall: {player.overallRating}</p>
      {/* ... more details */}
    </div>
  );
}
```

### Depois (API Integration)

```tsx
import { useEffect } from "react";
import { useParams } from "react-router";
import { usePlayer } from "../hooks/useApi";
import { mapApiPlayerToPlayer } from "../service/mappers";

export default function PlayerProfile() {
  const { id } = useParams();
  const { data: apiPlayer, loading, error, refetch } = usePlayer(id!, false);

  const player = apiPlayer ? mapApiPlayerToPlayer(apiPlayer) : null;

  useEffect(() => {
    if (id) refetch();
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!player) return <div>Player not found</div>;

  return (
    <div>
      <h1>{player.name}</h1>
      <p>Position: {player.position}</p>
      <p>Overall: {player.overallRating}</p>
      {/* ... rest unchanged */}
    </div>
  );
}
```

---

## ⚖️ Compare

### Antes (Mock Data)

```tsx
import { mockPlayers } from "../data/mockPlayers";
import { useState } from "react";

export default function Compare() {
  const [playerA, setPlayerA] = useState(mockPlayers[0]);
  const [playerB, setPlayerB] = useState(mockPlayers[1]);

  return (
    <div>
      <h1>Compare Players</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2>{playerA.name}</h2>
          <p>Overall: {playerA.overallRating}</p>
        </div>
        <div>
          <h2>{playerB.name}</h2>
          <p>Overall: {playerB.overallRating}</p>
        </div>
      </div>
    </div>
  );
}
```

### Depois (API Integration)

```tsx
import { useState, useEffect } from "react";
import { useComparison } from "../hooks/useApi";
import { mapApiPlayerToPlayer } from "../service/mappers";

export default function Compare() {
  const [playerAId, setPlayerAId] = useState("player1");
  const [playerBId, setPlayerBId] = useState("player2");

  const { data, loading, error, refetch } = useComparison(
    playerAId,
    playerBId,
    false
  );

  useEffect(() => {
    if (playerAId && playerBId) refetch();
  }, [playerAId, playerBId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return <div>Select players to compare</div>;

  const playerA = mapApiPlayerToPlayer(data.playerA);
  const playerB = mapApiPlayerToPlayer(data.playerB);

  return (
    <div>
      <h1>Compare Players</h1>
      
      {/* Player Selectors */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <PlayerSelector value={playerAId} onChange={setPlayerAId} />
        <PlayerSelector value={playerBId} onChange={setPlayerBId} />
      </div>

      {/* Comparison (unchanged) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2>{playerA.name}</h2>
          <p>Overall: {playerA.overallRating}</p>
        </div>
        <div>
          <h2>{playerB.name}</h2>
          <p>Overall: {playerB.overallRating}</p>
        </div>
      </div>

      {/* Comparison details from data.comparison */}
      {data.comparison && (
        <div className="mt-6">
          <h3>Detailed Comparison</h3>
          {/* Use data.comparison.attributes, etc. */}
        </div>
      )}
    </div>
  );
}
```

---

## 📄 Reports

### Antes (Mock Data)

```tsx
import { mockPlayers } from "../data/mockPlayers";
import { useState } from "react";

export default function Reports() {
  const [selectedPlayer, setSelectedPlayer] = useState(mockPlayers[0]);

  return (
    <div>
      <h1>Player Report</h1>
      <select onChange={(e) => setSelectedPlayer(mockPlayers[e.target.value])}>
        {mockPlayers.map((p, i) => (
          <option key={i} value={i}>{p.name}</option>
        ))}
      </select>

      <div>
        <h2>{selectedPlayer.name}</h2>
        <p>Risk Level: {selectedPlayer.riskLevel}</p>
        {/* ... more report data */}
      </div>
    </div>
  );
}
```

### Depois (API Integration com Explainability)

```tsx
import { useState, useEffect } from "react";
import { usePlayers, useExplainabilityReport } from "../hooks/useApi";
import { mapApiPlayersToPlayers } from "../service/mappers";

export default function Reports() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Get players list
  const { data: apiPlayers, loading: loadingPlayers } = usePlayers(1, 50, false);
  const players = apiPlayers ? mapApiPlayersToPlayers(apiPlayers) : [];

  // Get explainability report
  const {
    data: report,
    loading: loadingReport,
    refetch: fetchReport,
  } = useExplainabilityReport(selectedPlayerId || "", false);

  useEffect(() => {
    if (selectedPlayerId) fetchReport();
  }, [selectedPlayerId]);

  return (
    <div>
      <h1>Player Report</h1>

      {/* Player Selector */}
      <select
        onChange={(e) => setSelectedPlayerId(e.target.value)}
        disabled={loadingPlayers}
      >
        <option>Select a player...</option>
        {players.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Report Display */}
      {loadingReport && <div>Loading report...</div>}

      {report && selectedPlayerId && (
        <div className="mt-6">
          <h2>AI Analysis</h2>
          <p className="mb-4">{report.narrative}</p>

          <h3>Explanation</h3>
          <p className="mb-4">{report.explanation}</p>

          {/* Explainability Blocks */}
          {report.blocks?.map((block, i) => (
            <div key={i} className="mb-4 p-4 bg-gray-800 rounded">
              <h4>{block.title}</h4>
              <p>{block.content}</p>
            </div>
          ))}

          {/* SWOT Analysis */}
          {report.reasoning && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <h4>Strengths</h4>
                <ul>
                  {report.reasoning.strengths?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Weaknesses</h4>
                <ul>
                  {report.reasoning.weaknesses?.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 Componentes Auxiliares Reutilizáveis

### LoadingState

```tsx
import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-6 h-6 animate-spin text-[#00C2FF]" />
      <span className="ml-2 text-gray-400">Carregando dados...</span>
    </div>
  );
}
```

### ErrorState

```tsx
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

export function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-12 h-12 text-[#FF4D4F] mb-4" />
      <h3 className="text-xl font-semibold mb-2">Erro ao Carregar Dados</h3>
      <p className="text-gray-400 mb-4 max-w-md">{error}</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  );
}
```

---

## 📝 Checklist de Migração

Para cada página que você migrar:

- [ ] Importar hook apropriado (`usePlayers`, `usePlayer`, etc.)
- [ ] Importar mapper (`mapApiPlayerToPlayer`, etc.)
- [ ] Adicionar estados de loading
- [ ] Adicionar estados de error
- [ ] Adicionar `useEffect` para trigger de fetch
- [ ] Transformar dados da API antes de usar
- [ ] Testar com API desabilitada (mock fallback)
- [ ] Testar com API habilitada (dados reais)
- [ ] Verificar tratamento de casos edge (null, empty, etc.)

---

## 🚀 Ordem Recomendada de Migração

1. **Players List** (mais simples, teste inicial)
2. **Player Profile** (teste de detalhes)
3. **Compare** (teste de múltiplos requests)
4. **Dashboard** (métricas agregadas)
5. **Reports** (funcionalidade avançada)
6. **Watchlist** (teste de mutations)
7. **Alerts** (dados do sistema)

---

## ⚡ Dicas de Performance

### 1. Debounce em Search

```tsx
import { useState, useEffect } from "react";
import { usePlayerSearch } from "../hooks/useApi";

function PlayerSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  const { data } = usePlayerSearch({ query: debouncedQuery }, false);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

### 2. Cache com useMemo

```tsx
import { useMemo } from "react";

const enrichedPlayers = useMemo(() => {
  return players.map((p) => ({
    ...p,
    displayName: `${p.name} (${p.club})`,
  }));
}, [players]);
```

### 3. Lazy Loading

```tsx
const { data, loading, refetch } = usePlayers(page, 20, false);

// Only fetch when user scrolls or clicks
<button onClick={() => refetch()}>Load More</button>
```

---

**Última Atualização:** 2026-03-09  
**Versão da Documentação:** 1.0
