import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminPosts, login, logout } from './api';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import type { Post } from './types';

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  async function loadPosts() {
    const data = await getAdminPosts();
    setPosts(data);
    setAuthed(true);
  }

  useEffect(() => {
    loadPosts().catch(() => setAuthed(false)).finally(() => setChecking(false));
  }, []);

  async function handleLogin(password: string) {
    await login(password);
    await loadPosts();
    toast.success('Logged in.');
  }

  async function handleLogout() {
    await logout();
    setAuthed(false);
    setPosts([]);
    toast.success('Logged out.');
  }

  if (checking) return <div className="boot-screen">Checking admin session...</div>;
  if (!authed) return <LoginPage onLogin={handleLogin} />;
  return <DashboardPage posts={posts} setPosts={setPosts} reloadPosts={loadPosts} onLogout={handleLogout} />;
}
