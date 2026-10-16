const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ApiError extends Error {
  response?: Record<string, unknown>;
}

export async function apiFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${baseURL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = new Error(errorData.message || 'Request failed');
    error.response = errorData;
    throw error;
  }
  return response.json() as Promise<T>;
}
