import { type ApiEnvelope, apiFetch } from "./api";
import { mapCompareResponse } from "../mappers/compare.mapper";

export async function comparePlayers(idA: string, idB: string) {
  const response = await apiFetch<unknown>(`/compare/${idA}/${idB}`);

  return {
    ...response,
    data: mapCompareResponse(response.data),
  } satisfies ApiEnvelope<ReturnType<typeof mapCompareResponse>>;
}

export async function comparePlayersByName(nameA: string, nameB: string) {
  const response = await apiFetch<unknown>(
    `/compare/by-name/${encodeURIComponent(nameA)}/${encodeURIComponent(nameB)}`,
  );

  return {
    ...response,
    data: mapCompareResponse(response.data),
  } satisfies ApiEnvelope<ReturnType<typeof mapCompareResponse>>;
}
