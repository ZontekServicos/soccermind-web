import { type ApiEnvelope, apiFetch } from "./api";
import { getPlayer } from "./players";
import { mapApiPlayerToCard, type ApiPlayerLike, type PlayerCardModel } from "../mappers/player.mapper";

type UnknownRecord = Record<string, unknown>;

export interface WatchlistPlayerItem extends UnknownRecord {
  id: string;
  playerId: string;
  playerName: string | null;
  player: PlayerCardModel | null;
  team: string;
  league: string;
  overall: number;
  marketValue: number | null;
  createdAt: string | null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapData(value: unknown): unknown {
  if (isRecord(value) && "data" in value && value.data !== undefined) {
    return unwrapData(value.data);
  }

  return value;
}

function extractItems(payload: unknown): unknown[] {
  const unwrapped = unwrapData(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }

  if (!isRecord(unwrapped)) {
    return [];
  }

  const candidates = [unwrapped.items, unwrapped.watchlist, unwrapped.players];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

async function resolveWatchlistPlayer(item: UnknownRecord) {
  const directPlayer = isRecord(item.player)
    ? mapApiPlayerToCard(item.player as ApiPlayerLike | UnknownRecord)
    : null;

  if (directPlayer) {
    return directPlayer;
  }

  const playerId =
    typeof item.playerId === "string"
      ? item.playerId
      : typeof item.id === "string"
        ? item.id
        : null;

  if (!playerId) {
    return null;
  }

  try {
    const response = await getPlayer(playerId);
    return mapApiPlayerToCard(response.data as ApiPlayerLike | UnknownRecord);
  } catch {
    return null;
  }
}

async function mapWatchlistItem(item: unknown, index: number): Promise<WatchlistPlayerItem> {
  const source = isRecord(item) ? item : {};
  const player = await resolveWatchlistPlayer(source);
  const playerId =
    typeof source.playerId === "string"
      ? source.playerId
      : player?.id ?? `watchlist-player-${index}`;

  return {
    ...source,
    id:
      typeof source.id === "string"
        ? source.id
        : playerId,
    playerId,
    playerName:
      typeof source.playerName === "string"
        ? source.playerName
        : typeof source.nomeJogador === "string"
          ? source.nomeJogador
          : player?.name ?? null,
    player,
    team: player?.team ?? "",
    league: player?.league ?? "",
    overall: player?.overall ?? 0,
    marketValue: player?.marketValue ?? null,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : null,
  };
}

export async function getWatchlist() {
  const response = await apiFetch<unknown>("/watchlist");
  const items = await Promise.all(extractItems(response.data).map((item, index) => mapWatchlistItem(item, index)));

  return {
    ...response,
    data: items,
  } satisfies ApiEnvelope<WatchlistPlayerItem[]>;
}

export async function addToWatchlist(payload: { playerId: string }) {
  return apiFetch<unknown>("/watchlist", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeFromWatchlist(id: string) {
  return apiFetch<unknown>(`/watchlist/${id}`, {
    method: "DELETE",
  });
}
