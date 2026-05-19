import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('demo@vacado.app');
  const [password, setPassword] = useState('demo1234');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password);
      nav('/dashboard');
    } catch (e: any) {
      setErr(e.response?.data?.error ?? 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <h1><span className="v">V</span>acado</h1>
        <p className="auth-sub">Sign in to your automation dashboard</p>
        {err && <div className="auth-err">{err}</div>}
        <div className="auth-field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="auth-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        <div className="auth-alt">
          New to Vacado? <Link to="/register">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
