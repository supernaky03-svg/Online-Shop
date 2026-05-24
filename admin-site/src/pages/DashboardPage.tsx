import { LogOut, PackagePlus, RefreshCw, Store } from 'lucide-react';
import { Dispatch, SetStateAction, useState } from 'react';
import toast from 'react-hot-toast';
import { deletePost } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import PostFormModal from '../components/PostFormModal';
import PostTable from '../components/PostTable';
import ReviewsModal from '../components/ReviewsModal';
import type { Post } from '../types';

interface Props {
  posts: Post[];
  setPosts: Dispatch<SetStateAction<Post[]>>;
  reloadPosts: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export default function DashboardPage({ posts, setPosts, reloadPosts, onLogout }: Props) {
  const [formPost, setFormPost] = useState<Post | null | 'new'>(null);
  const [reviewPost, setReviewPost] = useState<Post | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await reloadPosts();
      toast.success('Posts refreshed.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deletePost(deleteTarget.id);
      setPosts((current) => current.filter((post) => post.id !== deleteTarget.id));
      toast.success('Post deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow"><Store size={16} /> Admin Dashboard</span>
          <h1>Manage online shop posts</h1>
          <p>Create products, edit buy contacts, and manage public reviews.</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={refresh} disabled={refreshing}><RefreshCw size={17} /> Refresh</button>
          <button className="secondary" onClick={onLogout}><LogOut size={17} /> Logout</button>
        </div>
      </header>

      <section className="toolbar">
        <div><strong>{posts.length}</strong><span>Total posts</span></div>
        <button onClick={() => setFormPost('new')}><PackagePlus size={18} /> Add Post</button>
      </section>

      <PostTable posts={posts} onEdit={(post) => setFormPost(post)} onDelete={(post) => setDeleteTarget(post)} onReviews={(post) => setReviewPost(post)} />

      {formPost ? (
        <PostFormModal
          post={formPost === 'new' ? null : formPost}
          onClose={() => setFormPost(null)}
          onSaved={(saved) => {
            setPosts((current) => {
              const exists = current.some((item) => item.id === saved.id);
              return exists ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current];
            });
            setFormPost(null);
          }}
        />
      ) : null}

      {reviewPost ? <ReviewsModal post={reviewPost} onClose={() => setReviewPost(null)} onChanged={reloadPosts} /> : null}

      {deleteTarget ? (
        <ConfirmModal
          title="Delete this post?"
          message={`This will permanently delete "${deleteTarget.name}", images records, buy contacts, and reviews.`}
          confirmText="Delete post"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </main>
  );
}
