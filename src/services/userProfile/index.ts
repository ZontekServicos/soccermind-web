import { apiFetch } from "../../app/services/api";
import type { ApiEnvelope } from "../../app/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id:        string;
  name:      string | null;
  email:     string | null;
  avatarUrl: string | null;
  role:      string;
  plan:      string;
  clubName:  string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name?:      string;
  avatarUrl?: string;
  clubName?:  string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<ApiEnvelope<UserProfile>> {
  return apiFetch<UserProfile>("/user/profile");
}

export async function updateUserProfile(
  data: UpdateProfilePayload,
): Promise<ApiEnvelope<UserProfile>> {
  return apiFetch<UserProfile>("/user/profile", {
    method: "PATCH",
    body:   JSON.stringify(data),
  });
}
