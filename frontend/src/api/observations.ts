import { fetchJson } from './client';
import type { ObservationListResponse, WavelengthResponse } from '../types/observation';

export async function searchObservations(
  ra: number,
  dec: number,
  radius: number = 0.01,
  page: number = 1,
  pageSize: number = 10
): Promise<ObservationListResponse> {
  const params = new URLSearchParams({
    ra: ra.toString(),
    dec: dec.toString(),
    radius: radius.toString(),
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  return fetchJson<ObservationListResponse>(`/api/v1/observations?${params.toString()}`);
}

export async function getWavelengthSets(
  ra: number,
  dec: number,
  radius: number = 0.01
): Promise<WavelengthResponse> {
  const params = new URLSearchParams({
    ra: ra.toString(),
    dec: dec.toString(),
    radius: radius.toString(),
  });

  return fetchJson<WavelengthResponse>(`/api/v1/observations/wavelengths?${params.toString()}`);
}