/**
 * Soccer Mind API Mappers
 * Adapts backend API data to frontend data structures
 */

import type { ApiPlayer } from "./api";
import type { PlayerExtended, PlayerStats } from "../types/player";

// ========================================
// Player Mappers
// ========================================

/**
 * Maps API player to frontend PlayerExtended structure
 * Handles missing fields with sensible defaults
 */
export function mapApiPlayerToPlayer(apiPlayer: ApiPlayer): PlayerExtended {
  // Calculate derived metrics (fallbacks for MVP)
  const overall = apiPlayer.overall ?? 75;
  const potential = apiPlayer.potential ?? overall + 5;
  const age = apiPlayer.age ?? 25;

  // Estimate capital efficiency based on available data
  const capitalEfficiency = calculateCapitalEfficiency(
    overall,
    potential,
    age,
    apiPlayer.marketValue
  );

  // Determine tier based on overall rating
  const tier = determineTier(overall);

  // Determine risk level
  const riskLevel = determineRiskLevel(age, overall, potential);

  // Map attributes to stats
  const stats = mapAttributesToStats(apiPlayer.attributes);

  return {
    id: apiPlayer.id,
    name: apiPlayer.name,
    position: apiPlayer.position ?? apiPlayer.positions?.[0] ?? "Unknown",
    age: apiPlayer.age,
    nationality: apiPlayer.nationality,
    club: apiPlayer.team ?? "Free Agent",
    overallRating: overall,
    tier: tier,
    positionRank: 0, // Will be calculated later if needed
    capitalEfficiency: capitalEfficiency,
    riskLevel: riskLevel,
    marketValue: formatMarketValue(apiPlayer.marketValue),
    contract: estimateContractExpiry(age),

    // Stats
    stats: stats,

    // Structural Risk
    structuralRisk: {
      score: calculateStructuralRisk(age, overall),
      level: riskLevel,
      breakdown: generateRiskFactors(age, overall, apiPlayer.team).join(", "),
    },

    // Anti-Flop Index
    antiFlopIndex: {
      flopProbability: calculateFlopProbability(age, overall, potential),
      safetyIndex: calculateSafetyIndex(age, overall, potential),
      classification: classifyInvestment(riskLevel),
    },

    // Liquidity
    liquidity: {
      score: calculateLiquidityScore(age, overall, apiPlayer.league),
      resaleWindow: determineResaleWindow(age, potential),
      marketProfile: determineMarketProfile(overall, apiPlayer.league),
    },

    // Financial Risk
    financialRisk: {
      index: calculateFinancialRisk(age, apiPlayer.marketValue),
      capitalExposure: calculateExposure(apiPlayer.marketValue),
      investmentProfile: generateInvestmentProfile(riskLevel, potential, overall),
    },
  };
}

/**
 * Maps array of API players to frontend Players
 */
export function mapApiPlayersToPlayers(apiPlayers: ApiPlayer[]): PlayerExtended[] {
  return apiPlayers.map(mapApiPlayerToPlayer);
}

// ========================================
// Helper Functions
// ========================================

function calculateCapitalEfficiency(
  overall: number,
  potential: number,
  age: number,
  marketValue: number | null
): number {
  // Base efficiency on performance vs cost
  const performanceScore = (overall + potential) / 2;
  const ageMultiplier = age < 23 ? 1.2 : age < 27 ? 1.0 : 0.8;
  const valueMultiplier = marketValue ? Math.max(0.5, 100 / (marketValue / 1000000)) : 1;

  return Math.min(10, (performanceScore / 10) * ageMultiplier * valueMultiplier);
}

function determineTier(overall: number): "ELITE" | "A" | "B" | "C" | "DEVELOPMENT" {
  if (overall >= 85) return "ELITE";
  if (overall >= 80) return "A";
  if (overall >= 75) return "B";
  if (overall >= 70) return "C";
  return "DEVELOPMENT";
}

function determineRiskLevel(
  age: number,
  overall: number,
  potential: number
): "LOW" | "MEDIUM" | "HIGH" {
  if (age > 30 && overall < 82) return "HIGH";
  if (age > 28 || (potential - overall) < 3) return "MEDIUM";
  return "LOW";
}

function calculateStructuralRisk(age: number, overall: number): number {
  // Higher risk for older players with lower ratings
  const ageRisk = age > 30 ? 7 : age > 27 ? 5 : 3;
  const performanceRisk = overall < 75 ? 5 : overall < 80 ? 3 : 1;
  return Math.min(10, ageRisk + performanceRisk);
}

function calculateFinancialRisk(age: number, marketValue: number | null): number {
  if (!marketValue) return 5;
  
  const valueRisk = marketValue > 50000000 ? 7 : marketValue > 20000000 ? 5 : 3;
  const ageRisk = age > 29 ? 3 : 0;
  return Math.min(10, valueRisk + ageRisk);
}

function calculateLiquidityScore(age: number, overall: number, league: string | null): number {
  let score = 5;

  // Age factor
  if (age < 25) score += 2;
  else if (age > 30) score -= 2;

  // Performance factor
  if (overall >= 85) score += 2;
  else if (overall < 75) score -= 1;

  // League factor
  const topLeagues = ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"];
  if (league && topLeagues.some((l) => league.includes(l))) score += 1;

  return Math.max(0, Math.min(10, score));
}

function calculateExposure(marketValue: number | null): string {
  if (!marketValue) return "Low";
  if (marketValue > 50000000) return "High";
  if (marketValue > 20000000) return "Medium";
  return "Low";
}

function calculatePaybackPeriod(age: number, overall: number): string {
  if (age < 23 && overall < 80) return "Long-term (4-6 years)";
  if (age < 27 && overall >= 80) return "Medium-term (2-4 years)";
  if (age < 30) return "Short-term (1-2 years)";
  return "Immediate impact";
}

function determineResaleWindow(age: number, potential: number): string {
  if (age < 22) return "4-6 years";
  if (age < 25) return "3-5 years";
  if (age < 28) return "2-3 years";
  return "1-2 years";
}

function determineMarketProfile(overall: number, league: string | null): string {
  const isTopLeague =
    league &&
    ["Premier League", "La Liga", "Serie A", "Bundesliga"].some((l) =>
      league.includes(l)
    );

  if (overall >= 85 && isTopLeague) {
    return "Premium asset with global market appeal and high liquidity";
  }
  if (overall >= 80) {
    return "Strong market position with solid resale potential";
  }
  if (overall >= 75) {
    return "Developing asset with regional market interest";
  }
  return "Emerging talent with limited but growing market visibility";
}

function formatMarketValue(value: number | null): string {
  if (!value) return "N/A";
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  return `€${(value / 1000).toFixed(0)}K`;
}

function estimateContractExpiry(age: number): string {
  const year = new Date().getFullYear();
  const yearsRemaining = age < 25 ? 3 : age < 30 ? 2 : 1;
  return `${year + yearsRemaining}`;
}

function generateRiskFactors(
  age: number,
  overall: number,
  team: string | null
): string[] {
  const factors: string[] = [];

  if (age > 30) factors.push("Advanced age reduces resale value");
  if (age < 21) factors.push("Development risk - unproven at top level");
  if (overall < 75) factors.push("Performance uncertainty");
  if (!team) factors.push("Currently without club");

  if (factors.length === 0) {
    factors.push("Stable profile with manageable risk factors");
  }

  return factors;
}

function classifyInvestment(riskLevel: "LOW" | "MEDIUM" | "HIGH"): string {
  switch (riskLevel) {
    case "LOW":
      return "Safe investment with strong fundamentals";
    case "MEDIUM":
      return "Moderate risk - requires careful monitoring";
    case "HIGH":
      return "High-risk profile - thorough due diligence required";
  }
}

function calculateFlopProbability(age: number, overall: number, potential: number): number {
  // Simple model to estimate flop probability
  const ageFactor = age > 30 ? 0.2 : age < 21 ? 0.3 : 0.1;
  const performanceFactor = overall < 75 ? 0.3 : overall < 80 ? 0.2 : 0.1;
  const potentialFactor = potential - overall < 3 ? 0.2 : 0.1;

  return Math.min(1, ageFactor + performanceFactor + potentialFactor);
}

function calculateSafetyIndex(age: number, overall: number, potential: number): number {
  // Simple model to estimate safety index
  const ageFactor = age > 30 ? 0.1 : age < 21 ? 0.2 : 0.3;
  const performanceFactor = overall < 75 ? 0.2 : overall < 80 ? 0.3 : 0.4;
  const potentialFactor = potential - overall < 3 ? 0.2 : 0.3;

  return Math.min(1, ageFactor + performanceFactor + potentialFactor);
}

function generateInvestmentProfile(riskLevel: "LOW" | "MEDIUM" | "HIGH", potential: number, overall: number): string {
  switch (riskLevel) {
    case "LOW":
      return "Low risk, high return potential";
    case "MEDIUM":
      return "Balanced risk and return, suitable for diversified portfolios";
    case "HIGH":
      return "High risk, high return potential, suitable for aggressive investors";
  }
}

function mapAttributesToStats(attributes?: Record<string, any>): PlayerStats {
  // Map API attributes to frontend stats structure
  // Default to reasonable values based on position if not available
  return {
    pace: attributes?.pace ?? attributes?.sprintSpeed ?? 70,
    passing: attributes?.passing ?? attributes?.shortPassing ?? 70,
    physical: attributes?.physical ?? attributes?.strength ?? 70,
    shooting: attributes?.shooting ?? attributes?.finishing ?? 70,
    defending: attributes?.defending ?? attributes?.defensiveAwareness ?? 50,
    dribbling: attributes?.dribbling ?? attributes?.ballControl ?? 70,
  };
}

// ========================================
// Comparison Mapper
// ========================================

export function mapComparisonAttributes(comparison: any) {
  // Maps comparison data to the format expected by comparison UI
  return {
    playerA: comparison.playerA,
    playerB: comparison.playerB,
    attributes: comparison.comparison?.attributes ?? {},
    overall: comparison.comparison?.overall ?? {},
    risk: comparison.comparison?.risk ?? {},
    financial: comparison.comparison?.financial ?? {},
  };
}

// ========================================
// Utility Functions
// ========================================

/**
 * Safely extracts nested data from API response
 */
export function safeExtract<T>(obj: any, path: string, defaultValue: T): T {
  const keys = path.split(".");
  let result = obj;

  for (const key of keys) {
    if (result?.[key] === undefined) return defaultValue;
    result = result[key];
  }

  return result ?? defaultValue;
}

/**
 * Checks if player data is complete enough for display
 */
export function isPlayerDataValid(player: ApiPlayer): boolean {
  return Boolean(player.id && player.name);
}
