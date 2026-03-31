export type MapLayer = 'literacy' | 'population' | 'sex_ratio' | 'sc_pct' | 'st_pct';

export type DrillLevel = 'national' | 'state' | 'district';

export interface State {
  name: string;
  population: number;
  area_sq_km: number;
  density: number;
  sex_ratio: number;
}

export interface District {
  code: string;
  name: string;
  state: string;
  population: number;
  literacy_rate: number;
  sex_ratio: number;
  sc_pct: number | null;
  st_pct: number | null;
  worker_rate: number | null;
}

export interface DistrictCensus extends District {
  Male: number;
  Female: number;
  Literate: number;
  SC: number;
  ST: number;
  Workers: number;
  Hindus: number;
  Muslims: number;
  Christians: number;
  Sikhs: number;
  Buddhists: number;
  Jains: number;
  Households: number;
  LPG_or_PNG_Households: number;
  Housholds_with_Electric_Lighting: number;
  [key: string]: unknown;
}

export interface NationalStats {
  source: string;
  total_districts: number;
  total_population: number;
  avg_literacy_rate: number;
  avg_sex_ratio: number;
  most_populous_district: { name: string; state: string; population: number };
  highest_literacy_district: { name: string; state: string; literacy: number };
  lowest_literacy_district: { name: string; state: string; literacy: number };
}

export interface SearchResult {
  type: 'state' | 'district';
  name: string;
  code?: string;
  state?: string;
  population: number;
}
