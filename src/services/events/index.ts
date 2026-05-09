import { apiFetch } from "../../app/services/api";
import type { ApiEnvelope } from "../../app/services/api";

export type UserEventType =
  | "PLAYER_VIEWED"
  | "PLAYER_COMPARED"
  | "SEARCH_PERFORMED"
  | "REPORT_GENERATED"
  | "GEM_OPENED";

export interface UserEventEntry {
  id:        string;
  type:      UserEventType;
  message:   string;
  payload:   Record<string, unknown>;
  createdAt: string;
}

export interface GetEventsParams {
  type?:  UserEventType;
  limit?: number;
}

export async function getEventHistory(
  params: GetEventsParams = {},
): Promise<ApiEnvelope<UserEventEntry[]>> {
  const qs = new URLSearchParams();
  if (params.type)             qs.set("type",  params.type);
  if (params.limit  != null)   qs.set("limit", String(params.limit));

  const query = qs.toString();
  const url   = `/events/history${query ? `?${query}` : ""}`;

  const envelope = await apiFetch<UserEventEntry[]>(url);
  return {
    ...envelope,
    data: Array.isArray(envelope.data) ? envelope.data : [],
  };
}
