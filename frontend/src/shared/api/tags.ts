import { apiClient } from './client';

export type TagType = 'technology' | 'level' | 'employment' | 'category';

export interface Tag {
  id: number;
  name: string;
  tagType: TagType;
  isSystem: boolean;
  isActive: boolean;
}

export async function getTags() {
  const { data } = await apiClient.get<Tag[]>('/tags');
  return data;
}
