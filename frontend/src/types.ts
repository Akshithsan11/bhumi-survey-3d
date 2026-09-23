export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

export interface Parcel {
  id: number;
  code: string;
  name?: string;
  area_sqm?: string;
  location_lat?: string;
  location_lng?: string;
  owner_name?: string;
  status: string;
  created_at: string;
}

export interface Building {
  id: number;
  parcel_id: number;
  code: string;
  height_m?: string;
  total_floors?: number;
  building_type?: string;
  ai_confidence?: string;
  status: string;
  created_at: string;
}

export interface Floor {
  id: number;
  building_id: number;
  floor_number: number;
  floor_height_m?: string;
  total_units: number;
  status: string;
}

export interface PropertyUnit {
  id: number;
  floor_id: number;
  unit_number?: string;
  area_sqft?: string;
  unit_type: string;
  occupancy_status: string;
  owner_name?: string;
  rent?: string;
}

export interface DashboardStats {
  buildings: number;
  parcels: number;
  floors: number;
  units: number;
  ulpins: number;
  underground_assets: number;
  avg_confidence: number;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}