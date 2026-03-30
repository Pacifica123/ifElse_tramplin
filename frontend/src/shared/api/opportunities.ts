import { apiClient } from './client';

export type OpportunityType = 'internship' | 'vacancy' | 'mentoring' | 'event';
export type WorkFormat = 'office' | 'hybrid' | 'remote';
export type EmploymentType = 'full_time' | 'part_time' | 'project';
export type Level = 'intern' | 'junior' | 'middle' | 'senior';
export type PublicationStatus =
  | 'draft'
  | 'pending_moderation'
  | 'active'
  | 'planned'
  | 'closed'
  | 'rejected';

export interface OpportunitySummary {
  id: number;
  title: string;
  shortDescription: string | null;
  employerProfileId: number;
  employerName: string | null;
  opportunityType: OpportunityType;
  workFormat: WorkFormat;
  publicationStatus: PublicationStatus;
  cityId: number | null;
  addressId: number | null;
  salaryFrom: number | null;
  salaryTo: number | null;
  tagIds: number[];
  cityName: string | null;
  addressText: string | null;
  latitude: number | null;
  longitude: number | null;
  isFavorite: boolean | null;
}

export interface OpportunityDetails extends OpportunitySummary {
  fullDescription: string | null;
  employmentType: EmploymentType | null;
  level: Level | null;
  publishedAt: string | null;
  expiresAt: string | null;
  eventDate: string | null;
  contactInfo: Record<string, unknown>;
  resourceLinks: string[];
  media: string[];
}

export interface PaginatedOpportunityList {
  items: OpportunitySummary[];
  page: number;
  perPage: number;
  total: number;
}

export interface PublicOpportunityListParams {
  page?: number;
  perPage?: number;
  q?: string;
  cityId?: number;
  workFormat?: WorkFormat;
  opportunityType?: OpportunityType;
  level?: Level;
  employmentType?: EmploymentType;
  tagIds?: number[];
  salaryFrom?: number;
  salaryTo?: number;
}

export interface EmployerOpportunityListParams {
  page?: number;
  perPage?: number;
  q?: string;
  publicationStatus?: PublicationStatus;
  workFormat?: WorkFormat;
  opportunityType?: OpportunityType;
}

export interface OpportunityCreatePayload {
  title: string;
  shortDescription: string;
  fullDescription: string;
  opportunityType: OpportunityType;
  workFormat: WorkFormat;
  employmentType?: EmploymentType | null;
  level?: Level | null;
  cityId?: number | null;
  addressId?: number | null;
  salaryFrom?: number | null;
  salaryTo?: number | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
  eventDate?: string | null;
  tagIds: number[];
  contactInfo: Record<string, unknown>;
  resourceLinks?: string[];
  media?: string[];
}

export interface OpportunityUpdatePayload extends Partial<OpportunityCreatePayload> {}

export async function getPublicOpportunities(params: PublicOpportunityListParams = {}) {
  const normalized = {
    ...params,
    tagIds: params.tagIds?.length ? params.tagIds.join(',') : undefined,
  };
  const { data } = await apiClient.get<PaginatedOpportunityList>('/opportunities', {
    params: normalized,
  });
  return data;
}

export async function getPublicOpportunityById(id: number | string) {
  const { data } = await apiClient.get<OpportunityDetails>(`/opportunities/${id}`);
  return data;
}

export async function getEmployerOpportunities(params: EmployerOpportunityListParams = {}) {
  const { data } = await apiClient.get<PaginatedOpportunityList>('/employer/opportunities', {
    params,
  });
  return data;
}

export async function createOpportunity(payload: OpportunityCreatePayload) {
  const { data } = await apiClient.post<OpportunityDetails>('/opportunities', payload);
  return data;
}

export async function updateOpportunity(id: number | string, payload: OpportunityUpdatePayload) {
  const { data } = await apiClient.patch<OpportunityDetails>(`/opportunities/${id}`, payload);
  return data;
}

export async function updateOpportunityStatus(id: number | string, publicationStatus: PublicationStatus) {
  const { data } = await apiClient.patch<OpportunityDetails>(`/opportunities/${id}/status`, {
    publicationStatus,
  });
  return data;
}
