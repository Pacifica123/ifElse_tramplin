import { apiClient } from './client';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'reserve';

export interface Application {
  id: number;
  opportunityId: number;
  applicantProfileId: number;
  status: ApplicationStatus;
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerApplication {
  id: number;
  opportunityId: number;
  applicantProfileId: number;
  status: ApplicationStatus;
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;
  applicant: {
    id: number;
    fullName: string;
    university: string | null;
    studyCourse: string | null;
    graduationYear: number | null;
    about: string | null;
  };
}

export interface PaginatedApplicationList<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
}

export interface ApplicationCreatePayload {
  coverLetter?: string;
}

export interface EmployerApplicationsParams {
  page?: number;
  perPage?: number;
  status?: ApplicationStatus;
  q?: string;
}

export async function applyToOpportunity(opportunityId: number | string, payload: ApplicationCreatePayload = {}) {
  const { data } = await apiClient.post<Application>(`/opportunities/${opportunityId}/applications`, payload);
  return data;
}

export async function getMyApplications(params: { page?: number; perPage?: number } = {}) {
  const { data } = await apiClient.get<PaginatedApplicationList<Application>>('/applications/me', { params });
  return data;
}

export async function getEmployerApplicationsForOpportunity(
  opportunityId: number | string,
  params: EmployerApplicationsParams = {},
) {
  const { data } = await apiClient.get<PaginatedApplicationList<EmployerApplication>>(
    `/employer/opportunities/${opportunityId}/applications`,
    { params },
  );
  return data;
}

export async function updateApplicationStatus(applicationId: number | string, status: ApplicationStatus) {
  const { data } = await apiClient.patch<Application>(`/applications/${applicationId}/status`, { status });
  return data;
}
