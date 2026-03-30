import { apiClient } from './client';
import type { AuthSession, SessionUser } from '@/shared/types/common';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role: 'applicant' | 'employer';
}

interface BackendUser {
  id: number;
  email: string;
  displayName: string;
  role: SessionUser['role'];
}

interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
}

function mapUser(user: BackendUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

function mapAuthResponse(data: BackendAuthResponse): AuthSession {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: mapUser(data.user),
  };
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const { data } = await apiClient.post<BackendAuthResponse>('/auth/login', payload);
  return mapAuthResponse(data);
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const { data } = await apiClient.post<BackendAuthResponse>('/auth/register', payload);
  return mapAuthResponse(data);
}

export async function refresh(refreshToken: string): Promise<AuthSession> {
  const { data } = await apiClient.post<BackendAuthResponse>('/auth/refresh', { refreshToken });
  return mapAuthResponse(data);
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function getMe(): Promise<SessionUser> {
  const { data } = await apiClient.get<BackendUser>('/me');
  return mapUser(data);
}
