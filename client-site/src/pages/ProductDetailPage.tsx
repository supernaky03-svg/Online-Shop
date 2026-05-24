import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaFacebook, FaTelegram, FaTiktok, FaViber } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import { createReview, getPost } from '../api';
import type { BuyContact, Post, Review } from '../types';
import { formatDate, formatKs, isValidEmail } from '../utils';

const iconMap = {
  facebook: FaFacebook,
  tiktok: FaTiktok,
  telegram: FaTelegram,
  viber: FaViber,
};

function ContactButton({ contact }: { contact: BuyContact }) {
  const Icon = iconMap[contact.contact_type] || MessageCircle;
  return (
    <a className={`contact-button ${contact.contact_type}`} href={contact.contact_url} target="_blank" rel="noopener noreferrer">
      <Icon size={22} />
      <span>{contact.contact_type}</span>
    </a>
  );
}

export default function ProductDetailPage() {
  const { postId } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAspectRatio, setActiveAspectRatio] = useState<number | null>(null);
  const [gmail, setGmail] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!postId) return;
      setLoading(true);
      setError('');
      try {
        const result = await getPost(Number(postId));
        setPost(result);
        setActiveImage(0);
        setActiveAspectRatio(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!post) return;
    if (!isValidEmail(gmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Review text cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      const review = await createReview(post.id, gmail.trim(), reviewText.trim());
      setPost((current) => current ? { ...current, reviews: [review, ...(current.reviews || [])], review_count: current.review_count + 1 } : current);
      setGmail('');
      setReviewText('');
      toast.success('Review submitted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="page"><div className="detail-loading">Loading product...</div></main>;
  }

  if (error || !post) {
    return (
      <main className="page">
        <Link className="back-link" to="/"><ArrowLeft size={18} /> Back</Link>
        <div className="alert error">{error || 'Product not found'}</div>
      </main>
    );
  }

  const images = post.images || [];
  const reviews: Review[] = post.reviews || [];
  const activeImageUrl = images[activeImage]?.image_url;

  return (
    <main className="page detail-page">
      <Link className="back-link" to="/"><ArrowLeft size={18} /> Back to shop</Link>

      <section className="product-shell">
        <div className="album">
          <div className="album-main" style={activeAspectRatio ? { aspectRatio: String(activeAspectRatio) } : undefined}>
            {activeImageUrl ? (
              <img
                src={activeImageUrl}
                alt={post.name}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    setActiveAspectRatio(img.naturalWidth / img.naturalHeight);
                  }
                }}
              />
            ) : <div className="image-fallback">No image</div>}
          </div>
          {images.length > 1 ? (
            <div className="album-thumbs">
              {images.map((image, index) => (
                <button key={image.id} className={index === activeImage ? 'active' : ''} onClick={() => { setActiveImage(index); setActiveAspectRatio(null); }}>
                  <img src={image.image_url} alt={`${post.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="product-info">
          <div className="product-title-row">
            <h1>{post.name}</h1>
            {post.instock ? <span className="stock-pill large">{post.instock}</span> : null}
          </div>
          <div className="detail-price">{formatKs(post.price)}</div>
          {post.caption ? <p className="caption-text">{post.caption}</p> : <p className="caption-text muted">No product description.</p>}

          <section className="buy-panel">
            <h2>Buy Contact</h2>
            {post.contacts.length > 0 ? (
              <div className="contact-grid">
                {post.contacts.map((contact) => <ContactButton key={contact.id} contact={contact} />)}
              </div>
            ) : <p className="muted">No buy contacts added yet.</p>}
          </section>
        </div>
      </section>

      <section className="reviews-section">
        <div className="section-title">
          <h2>Reviews</h2>
          <span>{reviews.length} public review{reviews.length === 1 ? '' : 's'}</span>
        </div>

        <form className="review-form" onSubmit={submitReview}>
          <input value={gmail} onChange={(event) => setGmail(event.target.value)} placeholder="Your Gmail / email address" inputMode="email" />
          <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="Write your review..." rows={4} />
          <button disabled={submitting} type="submit"><Send size={17} /> {submitting ? 'Submitting...' : 'Submit review'}</button>
        </form>

        {reviews.length === 0 ? (
          <div className="empty-state small"><MessageCircle size={28} /><h3>No reviews yet</h3><p>Be the first to review this product.</p></div>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div><strong>{review.gmail}</strong><span>{formatDate(review.created_at)}</span></div>
                <p>{review.review_text}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
