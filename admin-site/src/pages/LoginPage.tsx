import { LockKeyhole, Store } from 'lucide-react';
import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onLogin: (password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      toast.error('Password is required.');
      return;
    }
    setLoading(true);
    try {
      await onLogin(password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark"><Store size={30} /></div>
        <h1>Shop Admin</h1>
        <p>Password-only secure admin dashboard.</p>
        <label>
          <span>Admin password</span>
          <div className="input-icon"><LockKeyhole size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" /></div>
        </label>
        <button disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </main>
  );
}
