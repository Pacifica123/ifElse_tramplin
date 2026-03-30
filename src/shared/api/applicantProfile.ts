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

export interface ApplicantProfileView extends ApplicantProfile {
  visibilityScope: 'owner' | 'contact' | 'all_authorized' | 'hidden';
  careerInterestsVisible: boolean;
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

export async function getApplicantProfileById(applicantProfileId: number | string) {
  const { data } = await apiClient.get<ApplicantProfileView>(`/applicant-profiles/${applicantProfileId}`);
  return data;
}

export async function getEmployerVisibleApplicantProfileById(applicantProfileId: number | string) {
  const { data } = await apiClient.get<ApplicantProfileView>(`/employer/applicant-profiles/${applicantProfileId}`);
  return data;
}
