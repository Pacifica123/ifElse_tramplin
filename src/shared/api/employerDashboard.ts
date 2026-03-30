import { apiClient } from './client';

export type VerificationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationRequest {
  id: number;
  employerProfileId: number;
  status: VerificationRequestStatus;
  comment: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByCuratorId: number | null;
}

export async function getEmployerVerificationRequest() {
  const { data } = await apiClient.get<VerificationRequest>('/employer/verification-request');
  return data;
}

export async function createEmployerVerificationRequest(comment?: string) {
  const { data } = await apiClient.post<VerificationRequest>('/employer/verification-request', {
    comment,
  });
  return data;
}
