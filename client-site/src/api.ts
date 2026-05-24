import type { PaginatedPosts, Post, Review } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Something went wrong' }));
    throw new Error(error.detail || 'Something went wrong');
  }
  return res.json();
}

export function getPosts(search = '', limit = 24, offset = 0): Promise<PaginatedPosts> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (search.trim()) params.set('search', search.trim());
  return request<PaginatedPosts>(`/posts?${params.toString()}`);
}

export function getPost(postId: number): Promise<Post> {
  return request<Post>(`/posts/${postId}`);
}

export function getReviews(postId: number): Promise<Review[]> {
  return request<Review[]>(`/posts/${postId}/reviews`);
}

export function createReview(postId: number, gmail: string, review_text: string): Promise<Review> {
  return request<Review>(`/posts/${postId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ gmail, review_text }),
  });
}
