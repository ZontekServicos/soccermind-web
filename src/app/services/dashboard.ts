import { getExtendedPlayers } from "./players";

export async function getDashboardPlayers(limit = 80) {
  return getExtendedPlayers(1, limit);
}
