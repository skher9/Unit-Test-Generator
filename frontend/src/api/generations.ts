import { apiClient } from './client';

export interface Generation {
  id: string;
  inputCode: string;
  language: string;
  generatedTests: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function createGeneration(
  code: string,
  language: string
): Promise<Generation> {
  const { data } = await apiClient.post<Generation>('/generations', {
    code,
    language,
  });
  return data;
}

export async function listGenerations(): Promise<Generation[]> {
  const { data } = await apiClient.get<Generation[]>('/generations');
  return data;
}

export async function getGeneration(id: string): Promise<Generation> {
  const { data } = await apiClient.get<Generation>(`/generations/${id}`);
  return data;
}
