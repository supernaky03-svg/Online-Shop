import type { Post } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ detail: 'Something went wrong' }));
    throw new Error(payload.detail || 'Something went wrong');
  }
  return res.json();
}

export async function login(password: string): Promise<{ ok: boolean }> {
  return parseResponse(await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }));
}

export async function logout(): Promise<{ ok: boolean }> {
  return parseResponse(await fetch(`${API_BASE_URL}/admin/logout`, {
    method: 'POST',
    credentials: 'include',
  }));
}

export async function getAdminPosts(): Promise<Post[]> {
  return parseResponse(await fetch(`${API_BASE_URL}/admin/posts`, { credentials: 'include' }));
}

export async function getAdminPost(postId: number): Promise<Post> {
  return parseResponse(await fetch(`${API_BASE_URL}/admin/posts/${postId}`, { credentials: 'include' }));
}

export async function createPost(formData: FormData): Promise<Post> {
  return parseResponse(await fetch(`${API_BASE_URL}/admin/posts`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  }));
}

export async function updatePost(postId: number, formData: FormData): Promise<Post> {
  return parseResponse(await fetch(`${API_BASE_URL}/admin/posts/${postId}`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  }));
}

export async function deletePost(postId: number): Promise<{ ok: boolean }> {
  return parseResponse(await fetch(`${API_BASE_URL}/admin/posts/${postId}`, {
    method: 'DELETE',
    credentials: 'include',
  }));
}

export async function deleteReview(reviewId: number): Promise<{ ok: boolean }> {
  return parseResponse(await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
    method: 'DELETE',
    credentials: 'include',
  }));
}
