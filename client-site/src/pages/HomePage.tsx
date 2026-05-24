import { Search, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getPosts } from '../api';
import LoadingGrid from '../components/LoadingGrid';
import PostCard from '../components/PostCard';
import type { Post } from '../types';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 24;

  const hasMore = useMemo(() => posts.length < total, [posts.length, total]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getPosts(search, limit, 0);
        setPosts(result.items);
        setTotal(result.total);
        setOffset(result.items.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search]);

  async function loadMore() {
    setLoadingMore(true);
    setError('');
    try {
      const result = await getPosts(search, limit, offset);
      setPosts((current) => [...current, ...result.items]);
      setOffset((current) => current + result.items.length);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className="page home-page">
      <header className="hero">
        <div>
          <span className="eyebrow"><ShoppingBag size={16} /> Myanmar Online Shop</span>
          <h1>Find your next favorite item.</h1>
          <p>Clean product photos, prices in MMK, and direct buy contacts.</p>
        </div>
      </header>

      <section className="search-wrap" aria-label="Search products">
        <Search size={19} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product name..." />
      </section>

      {error ? <div className="alert error">{error}</div> : null}

      {loading ? <LoadingGrid /> : null}

      {!loading && posts.length === 0 ? (
        <section className="empty-state">
          <ShoppingBag size={38} />
          <h2>No products found</h2>
          <p>Try another search term or check back soon.</p>
        </section>
      ) : null}

      {!loading && posts.length > 0 ? (
        <>
          <div className="grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {hasMore ? (
            <button className="load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
