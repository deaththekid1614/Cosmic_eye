const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

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
