const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  stats: () => get<import('@/app/types').NationalStats>('/api/stats'),
  states: () => get<{ count: number; states: import('@/app/types').State[] }>('/api/states'),
  state: (name: string) => get<{ state: import('@/app/types').State; districts: import('@/app/types').District[] }>(`/api/states/${encodeURIComponent(name)}`),
  districts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<{ total: number; districts: import('@/app/types').District[] }>(`/api/districts${qs}`);
  },
  district: (code: string) => get<import('@/app/types').DistrictCensus>(`/api/districts/${code}`),
  search: (q: string) => get<{ results: import('@/app/types').SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`),
  geoStates: () => get<GeoJSON.FeatureCollection>('/api/geo/states'),
  geoDistricts: (state?: string) => get<GeoJSON.FeatureCollection>(`/api/geo/districts${state ? `?state=${encodeURIComponent(state)}` : ''}`),
  geoSubdistricts: () => get<GeoJSON.FeatureCollection>('/api/geo/subdistricts'),
};
