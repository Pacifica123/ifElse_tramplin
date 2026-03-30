import { apiClient } from './client';

export interface ApplicantProfile {
  id: number;
  userId: number;
  fullName: string;
  university: string | null;
  studyCourse: string | null;
  graduationYear: number | null;
  about: string | null;
  resumeText: string | null;
  portfolioLinks: string[];
  skills: string[];
}

export interface ApplicantProfileUpdatePayload {
  fullName?: string;
  university?: string | null;
  studyCourse?: string | null;
  graduationYear?: number | null;
  about?: string | null;
  resumeText?: string | null;
  portfolioLinks?: string[];
}

export async function getApplicantProfileMe() {
  const { data } = await apiClient.get<ApplicantProfile>('/applicant-profile/me');
  return data;
}

export async function updateApplicantProfileMe(payload: ApplicantProfileUpdatePayload) {
  const { data } = await apiClient.patch<ApplicantProfile>('/applicant-profile/me', payload);
  return data;
}
