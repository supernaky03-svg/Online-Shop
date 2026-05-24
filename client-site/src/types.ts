export type ContactType = 'facebook' | 'tiktok' | 'telegram' | 'viber';

export interface PostImage {
  id: number;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface BuyContact {
  id: number;
  contact_type: ContactType;
  contact_url: string;
  created_at: string;
}

export interface Review {
  id: number;
  post_id: number;
  gmail: string;
  review_text: string;
  created_at: string;
}

export interface Post {
  id: number;
  name: string;
  instock?: string | null;
  caption?: string | null;
  price: number;
  created_at: string;
  updated_at: string;
  images: PostImage[];
  contacts: BuyContact[];
  reviews?: Review[];
  review_count: number;
}

export interface PaginatedPosts {
  items: Post[];
  total: number;
  limit: number;
  offset: number;
}
