import axios from 'axios';
import { env } from '@/shared/config/env';

export const AUTH_STORAGE_KEY = 'trampolin-auth-session';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return config;

  try {
    const parsed = JSON.parse(raw) as { accessToken?: string };
    if (parsed.accessToken) {
      config.headers.Authorization = `Bearer ${parsed.accessToken}`;
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return config;
});
