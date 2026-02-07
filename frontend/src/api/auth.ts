import { apiClient, setStoredToken } from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/login', { email, password });
  setStoredToken(data.accessToken);
  return data;
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/register', {
    email,
    password,
    name: name || undefined,
  });
  setStoredToken(data.accessToken);
  return data;
}
