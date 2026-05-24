import { Link } from 'react-router-dom';
import type { Post } from '../types';
import { formatKs, previewCaption } from '../utils';

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  const image = post.images[0]?.image_url;
  return (
    <Link to={`/posts/${post.id}`} className="post-card" aria-label={`Open ${post.name}`}>
      <div className="post-card__imageWrap">
        {image ? <img src={image} alt={post.name} loading="lazy" /> : <div className="image-fallback">No image</div>}
      </div>
      <div className="post-card__body">
        <h2>{post.name}</h2>
        {post.instock ? <span className="stock-pill">{post.instock}</span> : null}
        <strong>{formatKs(post.price)}</strong>
        <p>{previewCaption(post.caption)}</p>
      </div>
    </Link>
  );
}
