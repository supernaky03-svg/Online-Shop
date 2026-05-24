import type { Post } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const ADMIN_TOKEN_KEY = 'shop_admin_token';

export function hasAdminToken(): boolean {
  return Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function saveAdminToken(token?: string | null): void {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ detail: 'Something went wrong' }));
    throw new Error(payload.detail || 'Something went wrong');
  }
  return res.json();
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return parseResponse(await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  }));
}

export async function login(password: string): Promise<{ ok: boolean; token?: string | null }> {
  const data = await parseResponse<{ ok: boolean; token?: string | null }>(await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }));
  saveAdminToken(data.token);
  return data;
}

export async function logout(): Promise<{ ok: boolean }> {
  try {
    return await adminFetch<{ ok: boolean }>('/admin/logout', { method: 'POST' });
  } finally {
    clearAdminToken();
  }
}

export async function getAdminPosts(): Promise<Post[]> {
  return adminFetch<Post[]>('/admin/posts');
}

export async function getAdminPost(postId: number): Promise<Post> {
  return adminFetch<Post>(`/admin/posts/${postId}`);
}

export async function createPost(formData: FormData): Promise<Post> {
  return adminFetch<Post>('/admin/posts', {
    method: 'POST',
    body: formData,
  });
}

export async function updatePost(postId: number, formData: FormData): Promise<Post> {
  return adminFetch<Post>(`/admin/posts/${postId}`, {
    method: 'PUT',
    body: formData,
  });
}

export async function deletePost(postId: number): Promise<{ ok: boolean }> {
  return adminFetch<{ ok: boolean }>(`/admin/posts/${postId}`, { method: 'DELETE' });
}

export async function deleteReview(reviewId: number): Promise<{ ok: boolean }> {
  return adminFetch<{ ok: boolean }>(`/admin/reviews/${reviewId}`, { method: 'DELETE' });
}
