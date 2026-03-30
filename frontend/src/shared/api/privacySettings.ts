import { apiClient } from './client';

export interface PrivacySettings {
  resumeVisibleToContacts: boolean;
  resumeVisibleToAllAuth: boolean;
  applicationsVisibleToContacts: boolean;
  applicationsVisibleToAllAuth: boolean;
  profileVisibleToAllAuth: boolean;
}

export async function getPrivacySettingsMe() {
  const { data } = await apiClient.get<PrivacySettings>('/privacy-settings/me');
  return data;
}

export async function updatePrivacySettingsMe(payload: PrivacySettings) {
  const { data } = await apiClient.patch<PrivacySettings>('/privacy-settings/me', payload);
  return data;
}
