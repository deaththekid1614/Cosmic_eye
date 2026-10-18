const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function observationPreviewUrl(sourceUrl: string, palette = 'inferno') {
  const params = new URLSearchParams({ url: sourceUrl });
  if (palette) params.set('palette', palette);
  return `${API_BASE}/api/v1/observations/preview?${params.toString()}`;
}

export function rgbPreviewUrl(sourceUrls: [string, string, string]) {
  const params = new URLSearchParams({ url1: sourceUrls[0], url2: sourceUrls[1], url3: sourceUrls[2] });
  return `${API_BASE}/api/v1/observations/preview/rgb?${params.toString()}`;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

export function getHealth() {
  return fetchJson<HealthResponse>('/api/v1/health');
}
