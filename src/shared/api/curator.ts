import { apiClient } from './client';
import type { ApplicantProfile } from './applicantProfile';
import type { EmployerProfile } from './employerProfile';
import type { OpportunityDetails, OpportunitySummary, OpportunityType, PublicationStatus, WorkFormat } from './opportunities';

export type CuratorVerificationStatus = 'pending' | 'approved' | 'rejected';

interface PaginatedResponse<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
}

interface VerificationRequestBackend {
  id: number;
  employerProfileId: number;
  status: CuratorVerificationStatus;
  comment: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByCuratorId: number | null;
}

export interface CuratorVerificationRequest extends VerificationRequestBackend {
  companyName: string;
}

export interface CuratorEmployer extends EmployerProfile {}
export interface CuratorApplicant extends ApplicantProfile {}
export interface CuratorOpportunity extends OpportunitySummary {}

export interface CuratorDashboardData {
  employersTotal: number;
  employersPending: number;
  employersVerified: number;
  applicantsTotal: number;
  applicantsPending: number;
  opportunitiesTotal: number;
  opportunitiesPending: number;
  opportunitiesRejected: number;
  verificationPending: number;
  latestVerificationRequests: CuratorVerificationRequest[];
}

export async function getCuratorVerificationRequests() {
  const [requestsResponse, employersResponse] = await Promise.all([
    apiClient.get<VerificationRequestBackend[]>('/curator/verification-requests'),
    apiClient.get<PaginatedResponse<EmployerProfile>>('/curator/employer-profiles', { params: { perPage: 100 } }),
  ]);

  const companyById = new Map<number, string>();
  for (const employer of employersResponse.data.items) {
    companyById.set(employer.id, employer.companyName || `Работодатель #${employer.id}`);
  }

  return requestsResponse.data.map((item) => ({
    ...item,
    companyName: companyById.get(item.employerProfileId) ?? `Работодатель #${item.employerProfileId}`,
  }));
}

export async function reviewCuratorVerificationRequest(
  requestId: number,
  payload: { status: CuratorVerificationStatus; comment?: string | null },
) {
  const { data } = await apiClient.patch<VerificationRequestBackend>(`/curator/verification-requests/${requestId}`, payload);
  return data;
}

export async function getCuratorEmployers(params: { q?: string; verificationStatus?: EmployerProfile['verificationStatus'] } = {}) {
  const { data } = await apiClient.get<PaginatedResponse<EmployerProfile>>('/curator/employer-profiles', {
    params: {
      perPage: 100,
      ...params,
    },
  });
  return data.items;
}

export async function getCuratorEmployerById(employerId: number | string) {
  const { data } = await apiClient.get<EmployerProfile>(`/curator/employer-profiles/${employerId}`);
  return data;
}

export async function updateCuratorEmployer(
  employerId: number,
  payload: Partial<{
    companyName: string;
    shortDescription: string | null;
    industry: string | null;
    websiteUrl: string | null;
    socialLinks: string[];
    officePhotos: string[];
    promoVideoUrl: string | null;
    cityId: number | null;
    verificationStatus: EmployerProfile['verificationStatus'];
    verificationComment: string | null;
    verifiedAt: string | null;
  }>,
) {
  const { data } = await apiClient.patch<EmployerProfile>(`/curator/employer-profiles/${employerId}`, payload);
  return data;
}

export async function getCuratorApplicants(params: { q?: string; university?: string } = {}) {
  const { data } = await apiClient.get<PaginatedResponse<ApplicantProfile>>('/curator/applicant-profiles', {
    params: {
      perPage: 100,
      ...params,
    },
  });
  return data.items;
}

export async function getCuratorApplicantById(applicantId: number | string) {
  const { data } = await apiClient.get<ApplicantProfile>(`/curator/applicant-profiles/${applicantId}`);
  return data;
}

export async function updateCuratorApplicant(
  applicantId: number,
  payload: Partial<{
    fullName: string;
    university: string | null;
    studyCourse: string | null;
    graduationYear: number | null;
    about: string | null;
    resumeText: string | null;
    portfolioLinks: string[];
  }>,
) {
  const { data } = await apiClient.patch<ApplicantProfile>(`/curator/applicant-profiles/${applicantId}`, payload);
  return data;
}

export async function getCuratorOpportunities(
  params: { q?: string; publicationStatus?: PublicationStatus; opportunityType?: OpportunityType } = {},
) {
  const { data } = await apiClient.get<PaginatedResponse<OpportunitySummary>>('/curator/opportunities', {
    params: {
      perPage: 100,
      ...params,
    },
  });
  return data.items;
}

export async function getCuratorOpportunityById(opportunityId: number | string) {
  const { data } = await apiClient.get<OpportunityDetails>(`/curator/opportunities/${opportunityId}`);
  return data;
}

export async function updateCuratorOpportunity(
  opportunityId: number,
  payload: Partial<{
    title: string;
    shortDescription: string;
    fullDescription: string;
    workFormat: WorkFormat;
    employmentType: OpportunityDetails['employmentType'];
    level: OpportunityDetails['level'];
    cityId: number | null;
    addressId: number | null;
    salaryFrom: number | null;
    salaryTo: number | null;
    expiresAt: string | null;
    eventDate: string | null;
    tagIds: number[];
    contactInfo: Record<string, unknown>;
    resourceLinks: string[];
    media: string[];
    publicationStatus: PublicationStatus;
  }>,
) {
  const { data } = await apiClient.patch<OpportunityDetails>(`/curator/opportunities/${opportunityId}`, payload);
  return data;
}

export async function getCuratorDashboard(): Promise<CuratorDashboardData> {
  const [verificationRequests, employers, applicants, opportunities] = await Promise.all([
    getCuratorVerificationRequests(),
    getCuratorEmployers(),
    getCuratorApplicants(),
    getCuratorOpportunities(),
  ]);

  const applicantsPending = applicants.filter((item) => !item.university || !item.resumeText).length;

  return {
    employersTotal: employers.length,
    employersPending: employers.filter((item) => item.verificationStatus === 'pending').length,
    employersVerified: employers.filter((item) => item.verificationStatus === 'verified').length,
    applicantsTotal: applicants.length,
    applicantsPending,
    opportunitiesTotal: opportunities.length,
    opportunitiesPending: opportunities.filter((item) => item.publicationStatus === 'pending_moderation').length,
    opportunitiesRejected: opportunities.filter((item) => item.publicationStatus === 'rejected').length,
    verificationPending: verificationRequests.filter((item) => item.status === 'pending').length,
    latestVerificationRequests: verificationRequests.slice(0, 5),
  };
}
