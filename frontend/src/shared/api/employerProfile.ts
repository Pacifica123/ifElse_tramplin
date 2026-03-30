import { apiClient } from './client';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface EmployerProfile {
  id: number;
  userId: number;
  companyName: string;
  shortDescription: string | null;
  industry: string | null;
  websiteUrl: string | null;
  socialLinks: string[];
  officePhotos: string[];
  promoVideoUrl: string | null;
  cityId: number | null;
  verificationStatus: VerificationStatus;
  verificationComment: string | null;
  verifiedAt: string | null;
}

export interface EmployerProfileUpdatePayload {
  companyName?: string;
  shortDescription?: string | null;
  industry?: string | null;
  websiteUrl?: string | null;
  socialLinks?: string[];
  officePhotos?: string[];
  promoVideoUrl?: string | null;
  cityId?: number | null;
}

export async function getEmployerProfileMe() {
  const { data } = await apiClient.get<EmployerProfile>('/employer-profile/me');
  return data;
}

export async function updateEmployerProfileMe(payload: EmployerProfileUpdatePayload) {
  const { data } = await apiClient.patch<EmployerProfile>('/employer-profile/me', payload);
  return data;
}
