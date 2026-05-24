import { Edit3, MessageCircle, Trash2 } from 'lucide-react';
import type { Post } from '../types';
import { formatDate, formatKs } from '../utils';

interface Props {
  posts: Post[];
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onReviews: (post: Post) => void;
}

export default function PostTable({ posts, onEdit, onDelete, onReviews }: Props) {
  if (posts.length === 0) {
    return <section className="empty-state"><h2>No posts yet</h2><p>Click Add Post to publish your first product.</p></section>;
  }

  return (
    <section className="post-list">
      {posts.map((post) => (
        <article className="admin-post-card" key={post.id}>
          <div className="admin-post-image">
            {post.images[0] ? <img src={post.images[0].image_url} alt={post.name} /> : <span>No image</span>}
          </div>
          <div className="admin-post-info">
            <h2>{post.name}</h2>
            <strong>{formatKs(post.price)}</strong>
            {post.instock ? <span className="stock-pill">{post.instock}</span> : null}
            <small>{formatDate(post.created_at)}</small>
          </div>
          <div className="admin-post-actions">
            <button className="secondary" onClick={() => onEdit(post)}><Edit3 size={16} /> Edit</button>
            <button className="secondary" onClick={() => onReviews(post)}><MessageCircle size={16} /> Reviews ({post.review_count})</button>
            <button className="danger subtle" onClick={() => onDelete(post)}><Trash2 size={16} /> Delete</button>
          </div>
        </article>
      ))}
    </section>
  );
}
