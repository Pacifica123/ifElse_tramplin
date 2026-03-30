import { apiClient } from './client';
import type { SessionUser } from '@/shared/types/common';

export interface CreateCuratorPayload {
  email: string;
  password: string;
  displayName: string;
  fullName: string;
  position?: string | null;
  role?: 'curator' | 'admin_curator';
}

interface BackendUser {
  id: number;
  email: string;
  displayName: string;
  role: SessionUser['role'];
}

function mapUser(user: BackendUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

export async function createCurator(payload: CreateCuratorPayload) {
  const { data } = await apiClient.post<BackendUser>('/admin/curators', payload);
  return mapUser(data);
}
