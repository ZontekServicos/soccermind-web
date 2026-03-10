import { mapApiPlayerToExtended, type ApiPlayerLike } from "./player.mapper";

export function mapCompareResponse(response: any) {
  const playerA = mapApiPlayerToExtended((response?.playerA || {}) as ApiPlayerLike);
  const playerB = mapApiPlayerToExtended((response?.playerB || {}) as ApiPlayerLike);
  const comparison = response?.comparison || {};
  const attributeComparison = comparison.attributes || {};

  return {
    playerA,
    playerB,
    comparison,
    radarData: [
      { attribute: "Pace", A: playerA.stats.pace, B: playerB.stats.pace },
      { attribute: "Shooting", A: playerA.stats.shooting, B: playerB.stats.shooting },
      { attribute: "Passing", A: playerA.stats.passing, B: playerB.stats.passing },
      { attribute: "Dribbling", A: playerA.stats.dribbling, B: playerB.stats.dribbling },
      { attribute: "Defending", A: playerA.stats.defending, B: playerB.stats.defending },
      { attribute: "Physical", A: playerA.stats.physical, B: playerB.stats.physical },
    ],
    comparisonStats: [
      { name: "Pace", a: attributeComparison.pace?.a ?? playerA.stats.pace, b: attributeComparison.pace?.b ?? playerB.stats.pace },
      { name: "Shooting", a: attributeComparison.shooting?.a ?? playerA.stats.shooting, b: attributeComparison.shooting?.b ?? playerB.stats.shooting },
      { name: "Passing", a: attributeComparison.passing?.a ?? playerA.stats.passing, b: attributeComparison.passing?.b ?? playerB.stats.passing },
      { name: "Dribbling", a: attributeComparison.dribbling?.a ?? playerA.stats.dribbling, b: attributeComparison.dribbling?.b ?? playerB.stats.dribbling },
      { name: "Defending", a: attributeComparison.defending?.a ?? playerA.stats.defending, b: attributeComparison.defending?.b ?? playerB.stats.defending },
      { name: "Physical", a: attributeComparison.physical?.a ?? playerA.stats.physical, b: attributeComparison.physical?.b ?? playerB.stats.physical },
    ],
  };
}
