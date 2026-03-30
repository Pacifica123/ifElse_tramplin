import { apiClient } from './client';

export interface CityReference {
  id: number;
  cityName: string;
  country: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface AddressReference {
  id: number;
  cityId: number;
  cityName: string;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
}

export async function getReferenceCities() {
  const { data } = await apiClient.get<CityReference[]>('/reference/cities');
  return data;
}

export async function getReferenceAddresses(cityId?: number | null) {
  const { data } = await apiClient.get<AddressReference[]>('/reference/addresses', {
    params: cityId ? { cityId } : undefined,
  });
  return data;
}
