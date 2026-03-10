# Soccer Mind - API Data Contracts

## 📊 Base Response Envelope

Todas as respostas da API seguem este padrão:

```typescript
{
  success: boolean;
  data: T;                    // Dados específicos do endpoint
  error: string | null;       // Mensagem de erro (se houver)
  meta?: {                    // Metadados (para endpoints paginados)
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

## 🎯 Player Contract

### API Player (Backend)

```typescript
{
  id: string;                 // Unique identifier
  name: string;               // Full player name
  position: string | null;    // Primary position (e.g., "ST", "CAM")
  positions: string[];        // All possible positions
  team: string | null;        // Current club
  league: string | null;      // Current league
  nationality: string;        // Country
  age: number;                // Age in years
  overall: number | null;     // Overall rating (0-100)
  potential: number | null;   // Potential rating (0-100)
  marketValue: number | null; // Market value in euros
  image: string | null;       // URL to player image
  attributes: {               // Optional detailed attributes
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physical?: number;
    // ... more granular stats
  }
}
```

### Frontend PlayerExtended (Após Mapping)

```typescript
{
  name: string;
  position: string;
  age: number;
  nationality: string;
  club: string;
  overallRating: number;
  tier: "ELITE" | "PREMIUM" | "STANDARD" | "PROSPECT";
  positionRank: number;
  capitalEfficiency: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  marketValue: string;        // Formatted: "€45M"
  contract: string;           // Year: "2026"
  
  stats: {
    pace: number;
    passing: number;
    physical: number;
    shooting: number;
    defending: number;
    dribbling: number;
  };
  
  structuralRisk: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH";
    breakdown: string;
  };
  
  antiFlopIndex: {
    flopProbability: number;
    safetyIndex: number;
    classification: string;
  };
  
  liquidity: {
    score: number;
    resaleWindow: string;
    marketProfile: string;
  };
  
  financialRisk: {
    index: number;
    capitalExposure: string;
    investmentProfile: string;
  };
}
```

## 🔍 Endpoints & Contracts

### 1. GET /api/players

**Query Parameters:**
```typescript
{
  page?: number;    // Default: 1
  limit?: number;   // Default: 20
}
```

**Response:**
```typescript
{
  success: true,
  data: ApiPlayer[],
  meta: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8
  }
}
```

### 2. GET /api/players/search

**Query Parameters:**
```typescript
{
  query?: string;         // Name search
  position?: string;      // Position filter
  team?: string;          // Team filter
  league?: string;        // League filter
  minAge?: number;        // Min age
  maxAge?: number;        // Max age
  minOverall?: number;    // Min overall rating
  maxOverall?: number;    // Max overall rating
}
```

**Response:**
```typescript
{
  success: true,
  data: ApiPlayer[]
}
```

### 3. GET /api/player/{id}

**Response:**
```typescript
{
  success: true,
  data: ApiPlayer
}
```

### 4. GET /api/player/{id}/projection

**Response:**
```typescript
{
  success: true,
  data: {
    playerId: string;
    projections: Array<{
      year: number;
      overall: number;
      marketValue: number;
      // ... more projection data
    }>;
    growth: {
      shortTerm: number;
      mediumTerm: number;
      longTerm: number;
    };
    development: {
      ceiling: number;
      trajectory: string;
      peakAge: number;
    };
  }
}
```

### 5. GET /api/player/{id}/similar

**Response:**
```typescript
{
  success: true,
  data: ApiPlayer[]
}
```

### 6. GET /api/player/{id}/notes

**Response:**
```typescript
{
  success: true,
  data: Array<{
    id: string;
    playerId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>
}
```

### 7. POST /api/player/{id}/notes

**Request Body:**
```typescript
{
  content: string;
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    playerId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

### 8. GET /api/compare/{idA}/{idB}

**Response:**
```typescript
{
  success: true,
  data: {
    playerA: ApiPlayer;
    playerB: ApiPlayer;
    comparison: {
      overall: {
        difference: number;
        winner: "A" | "B" | "tie";
      };
      attributes: {
        [key: string]: {
          playerA: number;
          playerB: number;
          difference: number;
        };
      };
      risk?: {
        playerA: number;
        playerB: number;
      };
      financial?: {
        playerA: {
          marketValue: number;
          roi: number;
        };
        playerB: {
          marketValue: number;
          roi: number;
        };
      };
    };
  }
}
```

### 9. GET /api/compare/by-name/{nameA}/{nameB}

**Same response structure as /api/compare/{idA}/{idB}**

### 10. GET /api/watchlist

**Response:**
```typescript
{
  success: true,
  data: Array<{
    id: string;
    player: ApiPlayer;
    addedAt: string;
  }>
}
```

### 11. POST /api/watchlist

**Request Body:**
```typescript
{
  playerId: string;
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    player: ApiPlayer;
    addedAt: string;
  }
}
```

### 12. DELETE /api/watchlist/{id}

**Response:**
```typescript
{
  success: true,
  data: {
    message: "Player removed from watchlist"
  }
}
```

### 13. GET /api/alerts

**Response:**
```typescript
{
  success: true,
  data: Array<{
    id: string;
    type: "opportunity" | "risk" | "noteworthy";
    title: string;
    description: string;
    playerId?: string;
    player?: ApiPlayer;
    createdAt: string;
  }>
}
```

### 14. GET /api/reports/{id}/explainability

**Response:**
```typescript
{
  success: true,
  data: {
    playerId: string;
    explanation: string;
    narrative: string;
    blocks: Array<{
      title: string;
      content: string;
      category: string;
    }>;
    reasoning: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
  }
}
```

### 15. POST /api/simulation/transfer

**Request Body:**
```typescript
{
  playerId: string;
  targetTeam: string;
  transferFee?: number;
  salary?: number;
  duration?: number;  // Contract years
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    impact: {
      tactical: string;
      squad: string;
      financial: string;
    };
    fit: {
      score: number;
      analysis: string;
    };
    recommendation: string;
    risk: {
      level: "LOW" | "MEDIUM" | "HIGH";
      factors: string[];
    };
  }
}
```

### 16. GET /api/team/analysis

**Query Parameters:**
```typescript
{
  teamId?: string;
  teamName?: string;
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    team: {
      id: string;
      name: string;
      league: string;
    };
    squad: ApiPlayer[];
    metrics: {
      averageAge: number;
      averageOverall: number;
      totalMarketValue: number;
    };
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }
}
```

### 17. GET /api/health

**Response:**
```typescript
{
  success: true,
  data: {
    status: "ok",
    timestamp: string;
    version: string;
  }
}
```

## 🔄 Data Transformation Flow

```
API Response (Railway)
         ↓
Response Envelope Validation
         ↓
Extract data from envelope.data
         ↓
Apply Mappers (mappers.ts)
         ↓
Enrich with Calculated Metrics
         ↓
Frontend PlayerExtended
         ↓
React Components
```

## 🎨 Calculated Metrics (Frontend)

Estas métricas são **calculadas no frontend** pelo mapper:

### Capital Efficiency
```typescript
capitalEfficiency = (
  (overall + potential) / 2 / 10
) * ageMultiplier * valueMultiplier
```

**Fatores:**
- Performance: média entre overall e potential
- Age: bonificação para < 23, neutro < 27, penalidade > 27
- Value: inversamente proporcional ao market value

### Tier Classification
```typescript
if (overall >= 85) → "ELITE"
if (overall >= 80) → "PREMIUM"
if (overall >= 75) → "STANDARD"
else              → "PROSPECT"
```

### Risk Level
```typescript
if (age > 30 && overall < 82) → "HIGH"
if (age > 28 || (potential - overall) < 3) → "MEDIUM"
else → "LOW"
```

### Structural Risk Score
```typescript
ageRisk = age > 30 ? 7 : age > 27 ? 5 : 3
performanceRisk = overall < 75 ? 5 : overall < 80 ? 3 : 1
structuralRisk = min(10, ageRisk + performanceRisk)
```

### Financial Risk Index
```typescript
valueRisk = marketValue > 50M ? 7 : marketValue > 20M ? 5 : 3
ageRisk = age > 29 ? 3 : 0
financialRisk = min(10, valueRisk + ageRisk)
```

### Liquidity Score
```typescript
baseScore = 5
if (age < 25) score += 2
if (age > 30) score -= 2
if (overall >= 85) score += 2
if (overall < 75) score -= 1
if (topLeague) score += 1
liquidity = clamp(0, 10, score)
```

## 🛡️ Error Handling

### Common Error Responses

**404 - Not Found:**
```typescript
{
  success: false,
  data: null,
  error: "Player not found"
}
```

**400 - Bad Request:**
```typescript
{
  success: false,
  data: null,
  error: "Invalid parameters"
}
```

**500 - Server Error:**
```typescript
{
  success: false,
  data: null,
  error: "Internal server error"
}
```

**Network Error (Frontend):**
```typescript
{
  success: false,
  data: null,
  error: "Failed to fetch"
}
```

## 🔧 Field Mapping Reference

| Backend Field | Frontend Field | Transformation |
|--------------|----------------|----------------|
| `id` | - | Not mapped (internal) |
| `name` | `name` | Direct |
| `position` | `position` | Direct / First of positions |
| `team` | `club` | Direct / "Free Agent" |
| `league` | - | Used in calculations |
| `nationality` | `nationality` | Direct |
| `age` | `age` | Direct |
| `overall` | `overallRating` | Default: 75 |
| `potential` | - | Used in calculations |
| `marketValue` | `marketValue` | Formatted (€45M) |
| `image` | - | Could be added |
| `attributes.*` | `stats.*` | Mapped to 6 core stats |

## 📝 Notes

1. **Null Safety:** Todos os campos opcionais têm fallbacks definidos
2. **Type Safety:** TypeScript garante tipos em runtime
3. **Validation:** Response envelope sempre validado
4. **Extensibility:** Novos campos podem ser adicionados facilmente
5. **Backward Compatibility:** Mock data permanece como fallback

---

**Versão:** 1.0  
**Última Atualização:** 2026-03-09  
**Backend:** Railway (Production)  
**Frontend:** Soccer Mind Platform
