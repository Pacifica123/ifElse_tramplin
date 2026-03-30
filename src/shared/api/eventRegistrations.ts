import { apiClient } from './client';
import type { OpportunitySummary } from './opportunities';

export type EventRegistrationStatus = 'registered' | 'cancelled';

export interface EventRegistration {
  id: number;
  opportunityId: number;
  applicantProfileId: number;
  status: EventRegistrationStatus;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export interface EventRegistrationListItem {
  registration: EventRegistration;
  opportunity: OpportunitySummary;
}

export interface PaginatedEventRegistrationList {
  items: EventRegistrationListItem[];
  page: number;
  perPage: number;
  total: number;
}

export interface EventRegistrationListParams {
  page?: number;
  perPage?: number;
  status?: EventRegistrationStatus;
  q?: string;
  upcomingOnly?: boolean;
}

export async function registerForEvent(opportunityId: number | string) {
  const { data } = await apiClient.post<EventRegistration>(`/opportunities/${opportunityId}/event-registration`);
  return data;
}

export async function cancelEventRegistration(opportunityId: number | string) {
  await apiClient.delete(`/opportunities/${opportunityId}/event-registration`);
}

export async function getMyEventRegistrations(params: EventRegistrationListParams = {}) {
  const { data } = await apiClient.get<PaginatedEventRegistrationList>('/event-registrations/me', { params });
  return data;
}
