'use client';
import { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = mode === 'login'
      ? { email: form.email, password: form.password }
      : { email: form.email, password: form.password, fullName: form.fullName };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Something went wrong. Please try again.');
        return;
      }

      if (mode === 'signup') {
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setMode('login');
        setForm((p) => ({ ...p, password: '', fullName: '' }));
      } else {
        // Successful login — refresh the page to update auth state
        window.location.reload();
      }
    } catch {
      setError('Network error. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-scale-up">
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-blue-500" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
              <span className="text-base font-black">U</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">
              Uni<span className="text-emerald-500">notes</span>
            </span>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  mode === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Success banner */}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              {success}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={mode === 'signup' ? 'Min 8 chars, one uppercase, one number' : '••••••••'}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-slate-900/15"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading
                ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-xs text-slate-400 mt-5">
              Don&apos;t have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-emerald-600 font-bold hover:underline">
                Sign up free
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
