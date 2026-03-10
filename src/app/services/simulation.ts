import { apiFetch } from "./api";

export async function simulateTransfer(payload: Record<string, unknown>) {
  return apiFetch<unknown>("/simulation/transfer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
