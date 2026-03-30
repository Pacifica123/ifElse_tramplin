import { apiClient } from './client';
import type { OpportunityType } from './opportunities';

export type ContactStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface Contact {
  id: number;
  requesterUserId: number;
  addresseeUserId: number;
  status: ContactStatus;
}

export type CareerInterestType = 'applied' | 'favorited';

export interface CareerInterest {
  type: CareerInterestType;
  opportunityId: number;
  opportunityTitle: string;
  opportunityType: OpportunityType;
  employerName: string | null;
  createdAt: string;
}

export async function getContacts() {
  const { data } = await apiClient.get<Contact[]>('/contacts');
  return data;
}

export async function createContactRequest(addresseeUserId: number) {
  const { data } = await apiClient.post<Contact>('/contacts/requests', { addresseeUserId });
  return data;
}

export async function updateContactStatus(contactId: number | string, status: ContactStatus) {
  const { data } = await apiClient.patch<Contact>(`/contacts/${contactId}`, { status });
  return data;
}

export async function getContactCareerInterests(applicantProfileId: number | string) {
  const { data } = await apiClient.get<CareerInterest[]>(`/contacts/applicant-profiles/${applicantProfileId}/career-interests`);
  return data;
}
