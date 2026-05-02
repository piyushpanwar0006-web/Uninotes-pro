'use client';
import { useState, useCallback } from 'react';
import {
  X, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Mail, Lock, User, Globe, ArrowLeft, ShieldCheck,
  Bookmark, Upload, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* ─── Password strength ─── */
function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}
const STRENGTH_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
const STRENGTH_TEXT   = ['', 'text-red-500', 'text-orange-500', 'text-amber-500', 'text-emerald-500', 'text-emerald-600'];

function PasswordStrengthBar({ password }) {
  const score = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? STRENGTH_COLORS[score] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold transition-colors ${STRENGTH_TEXT[score]}`}>
        {STRENGTH_LABELS[score]}
        {score < 3 && score > 0 && <span className="text-slate-400 font-normal ml-1">— add uppercase, numbers &amp; symbols</span>}
      </p>
    </div>
  );
}

/* ─── Input Field ─── */
function InputField({ label, icon: Icon, rightElement, error, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>{label}</label>}
      <div className="relative">
        {Icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }}><Icon size={16} /></span>}
        <input
          {...props}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${rightElement ? 'pr-11' : 'pr-4'} py-3 rounded-xl border text-sm font-medium outline-none transition-all ${
            error
              ? 'border-red-300 focus:ring-2 focus:ring-red-300 bg-red-50/50 dark:bg-red-950/20'
              : 'border-[var(--border)] focus:ring-2 focus:ring-emerald-400 focus:border-transparent hover:border-emerald-300'
          }`}
          style={{ backgroundColor: 'var(--card)', color: 'var(--text)' }}
        />
        {rightElement && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle size={11} className="shrink-0" /> {error}</p>}
    </div>
  );
}

/* ─── Divider ─── */
function Divider({ text = 'OR CONTINUE WITH' }) {
  return (
    <div className="relative flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
      <span className="text-[10px] font-black tracking-widest whitespace-nowrap" style={{ color: 'var(--muted)' }}>{text}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
    </div>
  );
}

/* ─── Trigger Banner ─── */
const TRIGGER_CONFIG = {
  bookmark: { icon: Bookmark, iconBg: 'bg-violet-100', iconColor: 'text-violet-600', border: 'border-violet-200', bg: 'bg-violet-50', title: 'Save this note', description: 'Sign in to bookmark papers and build your personal study collection.' },
  upload:   { icon: Upload,   iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50', title: 'Upload notes', description: 'Sign in to contribute notes and help your fellow students study smarter.' },
  generic:  { icon: Sparkles, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50', title: 'Unlock more features', description: 'Sign in to upload notes, bookmark papers, and access your dashboard.' },
};

function TriggerBanner({ trigger }) {
  if (!trigger || !TRIGGER_CONFIG[trigger]) return null;
  const cfg = TRIGGER_CONFIG[trigger];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.bg} ${cfg.border} mb-5`}>
      <div className={`w-8 h-8 ${cfg.iconBg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}><Icon size={15} className={cfg.iconColor} /></div>
      <div>
        <p className="text-sm font-bold text-slate-800">{cfg.title}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">{cfg.description}</p>
      </div>
    </div>
  );
}

/* ─── Main AuthModal ─── */
export default function AuthModal({ onClose, trigger = null, next = null }) {
  const supabase = createClient();

  const [view, setView] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [loading, setLoading] = useState(null);
  const [bannerError, setBannerError] = useState('');
  const [bannerSuccess, setBannerSuccess] = useState('');

  /* Sign In */
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [showSignInPwd, setShowSignInPwd] = useState(false);
  const [signInErrors, setSignInErrors] = useState({});

  /* Sign Up */
  const [signUpForm, setSignUpForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [showSignUpPwd, setShowSignUpPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signUpErrors, setSignUpErrors] = useState({});

  /* Forgot Password */
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');

  const clearBanners = () => { setBannerError(''); setBannerSuccess(''); };

  const switchView = (v) => {
    setView(v);
    clearBanners();
    setSignInErrors({});
    setSignUpErrors({});
    setForgotError('');
  };

  /* Validation */
  const validateSignIn = useCallback(() => {
    const errs = {};
    if (!signInForm.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInForm.email)) errs.email = 'Enter a valid email address';
    if (!signInForm.password) errs.password = 'Password is required';
    setSignInErrors(errs);
    return Object.keys(errs).length === 0;
  }, [signInForm]);

  const validateSignUp = useCallback(() => {
    const errs = {};
    if (!signUpForm.fullName || signUpForm.fullName.trim().length < 2) errs.fullName = 'Full name must be at least 2 characters';
    if (!signUpForm.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpForm.email)) errs.email = 'Enter a valid email address';
    if (!signUpForm.password) errs.password = 'Password is required';
    else if (signUpForm.password.length < 8) errs.password = 'Must be at least 8 characters';
    else if (!/[0-9]/.test(signUpForm.password)) errs.password = 'Must include at least one number';
    if (!signUpForm.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (signUpForm.password !== signUpForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!termsAccepted) errs.terms = 'You must accept the Terms of Service';
    setSignUpErrors(errs);
    return Object.keys(errs).length === 0;
  }, [signUpForm, termsAccepted]);

  /* Handlers */
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!validateSignIn()) return;
    setLoading('email');
    clearBanners();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInForm.email, password: signInForm.password }),
      });
      const json = await res.json();
      if (!json.success) { setBannerError(json.error || 'Invalid email or password.'); return; }
      if (next) { window.location.href = next; } else { window.location.reload(); }
    } catch {
      setBannerError('Network error. Please check your connection.');
    } finally {
      setLoading(null);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    setLoading('email');
    clearBanners();
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signUpForm.email, password: signUpForm.password, fullName: signUpForm.fullName.trim() }),
      });
      const json = await res.json();
      if (!json.success) { setBannerError(json.error || 'Could not create account. Please try again.'); return; }
      setBannerSuccess('🎉 Account created! Check your email to confirm, then sign in.');
      switchView('signin');
    } catch {
      setBannerError('Network error. Please check your connection.');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading('google');
    clearBanners();
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next }),
      });
      const json = await res.json();
      if (!json.success) {
        if (res.status === 429) {
          setBannerError('Too many sign-in attempts. Please wait a minute and try again.');
        } else if (json.code === 'PROVIDER_NOT_ENABLED') {
          setBannerError('Google sign-in is not configured yet. Please use email sign-in for now.');
        } else {
          setBannerError(json.error || 'Could not connect to Google. Please try again.');
        }
        setLoading(null);
        return;
      }
      // Redirect to Google's OAuth consent screen
      window.location.href = json.data.url;
    } catch {
      setBannerError('Network error. Please check your connection.');
      setLoading(null);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError('Please enter a valid email address');
      return;
    }
    setLoading('forgot');
    setForgotError('');
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(null);
    if (error) { setForgotError('Could not send reset email. Please try again.'); }
    else { setBannerSuccess('✉️ Password reset email sent! Check your inbox.'); switchView('signin'); }
  };

  const isLoading = loading !== null;
  const pwdScore = getStrength(signUpForm.password);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,17,34,0.72)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-scale-up"
        style={{ backgroundColor: 'var(--surface)', boxShadow: '0 25px 60px -10px rgba(16,185,129,0.18), 0 15px 35px -5px rgba(0,0,0,0.25)' }}
      >
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400" />

        {/* Close */}
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          style={{ color: 'var(--muted)' }}
        >
          <X size={18} />
        </button>

        <div className="px-8 pb-8 pt-6">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <span className="text-base font-black tracking-tighter">U</span>
            </div>
            <span className="text-xl font-black tracking-tighter" style={{ color: 'var(--text)' }}>Uni<span className="text-emerald-500">notes</span></span>
          </div>

          {/* Banners */}
          {bannerSuccess && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-4 text-sm text-emerald-700 dark:text-emerald-400 animate-fade-in">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" /><span>{bannerSuccess}</span>
            </div>
          )}
          {bannerError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl mb-4 text-sm text-red-600 animate-fade-in">
              <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{bannerError}</span>
            </div>
          )}

          {/* ── SIGN IN ── */}
          {view === 'signin' && (
            <>
              <TriggerBanner trigger={trigger} />
              <div className="mb-6">
                <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Welcome back</h1>
                <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>Sign in to your Uninotes account</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                <InputField
                  label="Email Address" icon={Mail} type="email" id="signin-email"
                  placeholder="you@example.com" value={signInForm.email} autoComplete="email"
                  onChange={(e) => { setSignInForm(p => ({ ...p, email: e.target.value })); setSignInErrors(p => ({ ...p, email: '' })); clearBanners(); }}
                  error={signInErrors.email}
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                    <button type="button" onClick={() => switchView('forgot')} className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <InputField
                    label="" icon={Lock} type={showSignInPwd ? 'text' : 'password'} id="signin-password"
                    placeholder="••••••••" value={signInForm.password} autoComplete="current-password"
                    onChange={(e) => { setSignInForm(p => ({ ...p, password: e.target.value })); setSignInErrors(p => ({ ...p, password: '' })); clearBanners(); }}
                    error={signInErrors.password}
                    rightElement={
                      <button type="button" onClick={() => setShowSignInPwd(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors p-0.5" tabIndex={-1} aria-label={showSignInPwd ? 'Hide' : 'Show'}>
                        {showSignInPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                </div>

                <button type="submit" disabled={isLoading} id="signin-submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 mt-2">
                  {loading === 'email' ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign in'}
                </button>
              </form>

              <Divider />

              <button type="button" onClick={handleGoogle} disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border text-sm font-semibold hover:border-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {loading === 'google' ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--muted)' }} /> : <Globe size={16} className="text-[#4285F4]" />}
                Continue with Google
              </button>

              <p className="text-center text-xs font-medium mt-5" style={{ color: 'var(--muted)' }}>
                No account?{' '}
                <button onClick={() => switchView('signup')} className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors">
                  Create one free
                </button>
              </p>
            </>
          )}

          {/* ── SIGN UP ── */}
          {view === 'signup' && (
            <>
              <TriggerBanner trigger={trigger} />
              <div className="mb-6">
                <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Begin your journey</h1>
                <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>Join thousands of MBM students learning smarter</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                <InputField
                  label="Full Name" icon={User} type="text" id="signup-fullname"
                  placeholder="Your full name" value={signUpForm.fullName} autoComplete="name"
                  onChange={(e) => { setSignUpForm(p => ({ ...p, fullName: e.target.value })); setSignUpErrors(p => ({ ...p, fullName: '' })); clearBanners(); }}
                  error={signUpErrors.fullName}
                />
                <InputField
                  label="Email Address" icon={Mail} type="email" id="signup-email"
                  placeholder="you@example.com" value={signUpForm.email} autoComplete="email"
                  onChange={(e) => { setSignUpForm(p => ({ ...p, email: e.target.value })); setSignUpErrors(p => ({ ...p, email: '' })); clearBanners(); }}
                  error={signUpErrors.email}
                />

                <div>
                  <InputField
                    label="Password" icon={Lock} type={showSignUpPwd ? 'text' : 'password'} id="signup-password"
                    placeholder="Min 8 chars, number required" value={signUpForm.password} autoComplete="new-password"
                    onChange={(e) => { setSignUpForm(p => ({ ...p, password: e.target.value })); setSignUpErrors(p => ({ ...p, password: '' })); clearBanners(); }}
                    error={signUpErrors.password}
                    rightElement={
                      <button type="button" onClick={() => setShowSignUpPwd(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors p-0.5" tabIndex={-1}>
                        {showSignUpPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <PasswordStrengthBar password={signUpForm.password} />
                </div>

                <div>
                  <InputField
                    label="Confirm Password" icon={ShieldCheck} type={showConfirmPwd ? 'text' : 'password'} id="signup-confirm-password"
                    placeholder="Repeat your password" value={signUpForm.confirmPassword} autoComplete="new-password"
                    onChange={(e) => { setSignUpForm(p => ({ ...p, confirmPassword: e.target.value })); setSignUpErrors(p => ({ ...p, confirmPassword: '' })); clearBanners(); }}
                    error={signUpErrors.confirmPassword}
                    rightElement={
                      <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors p-0.5" tabIndex={-1}>
                        {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  {signUpForm.confirmPassword && signUpForm.password && !signUpErrors.confirmPassword && (
                    <p className={`mt-1 text-xs font-semibold flex items-center gap-1 ${signUpForm.password === signUpForm.confirmPassword ? 'text-emerald-500' : 'text-red-500'}`}>
                      {signUpForm.password === signUpForm.confirmPassword
                        ? <><CheckCircle2 size={11} /> Passwords match</>
                        : <><AlertCircle size={11} /> Passwords don&apos;t match yet</>}
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                    <div
                      onClick={() => { setTermsAccepted(v => !v); setSignUpErrors(p => ({ ...p, terms: '' })); }}
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 transition-all cursor-pointer ${termsAccepted ? 'bg-emerald-500 border-emerald-500' : `border-slate-300 bg-white group-hover:border-emerald-400 ${signUpErrors.terms ? 'border-red-400' : ''}`}`}
                    >
                      {termsAccepted && <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span className="text-xs font-medium text-slate-600 leading-relaxed">
                      I agree to the <a href="#" className="text-emerald-600 font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-emerald-600 font-semibold hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                  {signUpErrors.terms && (
                    <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1 ml-6">
                      <AlertCircle size={11} /> {signUpErrors.terms}
                    </p>
                  )}
                </div>

                <button type="submit" disabled={isLoading || pwdScore < 2} id="signup-submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 mt-2">
                  {loading === 'email' ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create Account'}
                </button>
              </form>

              <Divider />

              <button type="button" onClick={handleGoogle} disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border text-sm font-semibold hover:border-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {loading === 'google' ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--muted)' }} /> : <Globe size={16} className="text-[#4285F4]" />}
                Continue with Google
              </button>

              <p className="text-center text-xs font-medium mt-5" style={{ color: 'var(--muted)' }}>
                Already have an account?{' '}
                <button onClick={() => switchView('signin')} className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors">Sign in</button>
              </p>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {view === 'forgot' && (
            <>
              <button onClick={() => switchView('signin')} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-5 group">
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to Sign In
              </button>
              <div className="mb-6">
                <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Forgot password?</h1>
                <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>No worries — we&apos;ll send a reset link to your email.</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                <InputField
                  label="Email Address" icon={Mail} type="email" id="forgot-email"
                  placeholder="you@example.com" value={forgotEmail} autoComplete="email"
                  onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                  error={forgotError}
                />
                <button type="submit" disabled={isLoading} id="forgot-submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25">
                  {loading === 'forgot' ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
