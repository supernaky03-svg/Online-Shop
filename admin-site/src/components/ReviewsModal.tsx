import { Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteReview, getAdminPost } from '../api';
import type { Post, Review } from '../types';
import { formatDate } from '../utils';

interface Props {
  post: Post;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

export default function ReviewsModal({ post, onClose, onChanged }: Props) {
  const [reviews, setReviews] = useState<Review[]>(post.reviews || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const detail = await getAdminPost(post.id);
        setReviews(detail.reviews || []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [post.id]);

  async function remove(review: Review) {
    if (!confirm(`Delete review from ${review.gmail}?`)) return;
    try {
      await deleteReview(review.id);
      setReviews((current) => current.filter((item) => item.id !== review.id));
      await onChanged();
      toast.success('Review deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete review');
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="reviews-modal">
        <div className="modal-head"><div><h2>Reviews</h2><p>{post.name}</p></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>
        {loading ? <p className="muted">Loading reviews...</p> : null}
        {!loading && reviews.length === 0 ? <div className="empty-state"><h3>No reviews yet</h3><p>Client reviews will appear here.</p></div> : null}
        <div className="review-list">
          {reviews.map((review) => (
            <article className="admin-review-card" key={review.id}>
              <div><strong>{review.gmail}</strong><small>{formatDate(review.created_at)}</small></div>
              <p>{review.review_text}</p>
              <button className="danger subtle" onClick={() => remove(review)}><Trash2 size={16} /> Delete</button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
