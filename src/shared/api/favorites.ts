import { apiClient } from './client';
import type { EmployerProfile } from './employerProfile';
import type { OpportunitySummary } from './opportunities';

export async function getFavoriteOpportunities() {
  const { data } = await apiClient.get<OpportunitySummary[]>('/favorites/opportunities');
  return data;
}

export async function addFavoriteOpportunity(opportunityId: number | string) {
  await apiClient.post(`/favorites/opportunities/${opportunityId}`);
}

export async function removeFavoriteOpportunity(opportunityId: number | string) {
  await apiClient.delete(`/favorites/opportunities/${opportunityId}`);
}

export async function getFavoriteEmployers() {
  const { data } = await apiClient.get<EmployerProfile[]>('/favorites/employers');
  return data;
}

export async function addFavoriteEmployer(employerProfileId: number | string) {
  await apiClient.post(`/favorites/employers/${employerProfileId}`);
}

export async function removeFavoriteEmployer(employerProfileId: number | string) {
  await apiClient.delete(`/favorites/employers/${employerProfileId}`);
}
