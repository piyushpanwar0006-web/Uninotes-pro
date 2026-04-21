'use client';
import { useState, useCallback } from 'react';
import {
  X, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  Mail, Lock, User, Phone, Globe, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* ─────────────────────────────────────────────
   Password strength helpers
───────────────────────────────────────────── */
function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (pwd.length >= 12)          score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0-5
}

const STRENGTH_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = [
  '',
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-emerald-500',
];
const STRENGTH_TEXT = [
  '',
  'text-red-500',
  'text-orange-500',
  'text-amber-500',
  'text-emerald-500',
  'text-emerald-600',
];

function PasswordStrengthBar({ password }) {
  const score = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? STRENGTH_COLORS[score] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-semibold transition-colors ${STRENGTH_TEXT[score]}`}>
        {STRENGTH_LABELS[score]}
        {score < 3 && score > 0 && (
          <span className="text-slate-400 font-normal ml-1">— add uppercase, numbers &amp; symbols</span>
        )}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Reusable Input Field
───────────────────────────────────────────── */
function InputField({ label, icon: Icon, rightElement, error, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={16} />
          </span>
        )}
        <input
          {...props}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${
            rightElement ? 'pr-11' : 'pr-4'
          } py-3 rounded-xl border text-slate-900 text-sm font-medium outline-none transition-all placeholder:text-slate-300
            ${error
              ? 'border-red-300 focus:ring-2 focus:ring-red-300 bg-red-50/50'
              : 'border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white hover:border-slate-300'
            }`}
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
          <AlertCircle size={11} className="shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Social Auth Button
───────────────────────────────────────────── */
function SocialButton({ icon: Icon, label, onClick, disabled, iconColor }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      <Icon size={16} className={iconColor} />
      <span className="truncate">{label}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Divider
───────────────────────────────────────────── */
function Divider({ text = 'OR CONTINUE WITH' }) {
  return (
    <div className="relative flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-slate-100" />
      <span className="text-[10px] font-black text-slate-400 tracking-widest whitespace-nowrap">{text}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main AuthModal
───────────────────────────────────────────── */
export default function AuthModal({ onClose }) {
  const supabase = createClient();

  // View: 'signin' | 'signup' | 'forgot'
  const [view, setView] = useState('signin');
  const [loading, setLoading] = useState(null); // null | 'email' | 'google' | 'phone' | 'forgot'
  const [bannerError, setBannerError] = useState('');
  const [bannerSuccess, setBannerSuccess] = useState('');

  /* ── Sign In state ── */
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showSignInPwd, setShowSignInPwd] = useState(false);
  const [signInErrors, setSignInErrors] = useState({});

  /* ── Sign Up state ── */
  const [signUpForm, setSignUpForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });
  const [showSignUpPwd, setShowSignUpPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signUpErrors, setSignUpErrors] = useState({});

  /* ── Forgot Password state ── */
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');

  /* ─────────── helpers ─────────── */
  const clearBanners = () => { setBannerError(''); setBannerSuccess(''); };

  const switchView = (v) => {
    setView(v);
    clearBanners();
    setSignInErrors({});
    setSignUpErrors({});
    setForgotError('');
  };

  /* ─────────── Sign In Validation ─────────── */
  const validateSignIn = useCallback(() => {
    const errs = {};
    if (!signInForm.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInForm.email)) errs.email = 'Enter a valid email address';
    if (!signInForm.password) errs.password = 'Password is required';
    setSignInErrors(errs);
    return Object.keys(errs).length === 0;
  }, [signInForm]);

  /* ─────────── Sign Up Validation ─────────── */
  const validateSignUp = useCallback(() => {
    const errs = {};
    if (!signUpForm.fullName || signUpForm.fullName.trim().length < 2)
      errs.fullName = 'Full name must be at least 2 characters';
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

  /* ─────────── Email Sign In ─────────── */
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
      if (!json.success) {
        setBannerError(json.error || 'Invalid email or password.');
        return;
      }
      window.location.reload();
    } catch {
      setBannerError('Network error. Please check your connection.');
    } finally {
      setLoading(null);
    }
  };

  /* ─────────── Email Sign Up ─────────── */
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    setLoading('email');
    clearBanners();
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signUpForm.email,
          password: signUpForm.password,
          fullName: signUpForm.fullName.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setBannerError(json.error || 'Could not create account. Please try again.');
        return;
      }
      setBannerSuccess('🎉 Account created! Check your email to confirm, then sign in.');
      switchView('signin');
    } catch {
      setBannerError('Network error. Please check your connection.');
    } finally {
      setLoading(null);
    }
  };

  /* ─────────── Google OAuth ─────────── */
  const handleGoogle = async () => {
    setLoading('google');
    clearBanners();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) { setBannerError('Could not connect to Google. Please try again.'); setLoading(null); }
    // On success, Supabase redirects the page — no cleanup needed
  };

  /* ─────────── Phone / OTP ─────────── */
  const handlePhone = async () => {
    setLoading('phone');
    clearBanners();
    const phone = window.prompt('Enter your mobile number with country code (e.g. +919876543210):');
    if (!phone) { setLoading(null); return; }
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      setBannerError('Could not send OTP. Check the number and try again.');
    } else {
      const otp = window.prompt('Enter the OTP sent to your phone:');
      if (!otp) { setLoading(null); return; }
      const { error: verifyErr } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      if (verifyErr) {
        setBannerError('Invalid OTP. Please try again.');
      } else {
        window.location.reload();
      }
    }
    setLoading(null);
  };

  /* ─────────── Forgot Password ─────────── */
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
    if (error) {
      setForgotError('Could not send reset email. Please try again.');
    } else {
      setBannerSuccess('✉️ Password reset email sent! Check your inbox.');
      switchView('signin');
    }
  };

  const isLoading = loading !== null;
  const pwdScore = getStrength(signUpForm.password);

  /* ─────────── RENDER ─────────── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,17,34,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-scale-up"
        style={{ boxShadow: '0 25px 60px -10px rgba(16,185,129,0.18), 0 15px 35px -5px rgba(0,0,0,0.15)' }}
      >
        {/* Top gradient accent */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400" />

        {/* Close button */}
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
        >
          <X size={18} />
        </button>

        <div className="px-8 pb-8 pt-6">

          {/* ── Logo ── */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <span className="text-base font-black tracking-tighter">U</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">
              Uni<span className="text-emerald-500">notes</span>
            </span>
          </div>

          {/* ── Global Banners ── */}
          {bannerSuccess && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-sm text-emerald-700 animate-fade-in">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <span>{bannerSuccess}</span>
            </div>
          )}
          {bannerError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-600 animate-fade-in">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{bannerError}</span>
            </div>
          )}

          {/* ══════════════════════════════════
              SIGN IN VIEW
          ══════════════════════════════════ */}
          {view === 'signin' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Sign in to your Uninotes account</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                <InputField
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  id="signin-email"
                  placeholder="you@example.com"
                  value={signInForm.email}
                  onChange={(e) => { setSignInForm(p => ({ ...p, email: e.target.value })); setSignInErrors(p => ({ ...p, email: '' })); clearBanners(); }}
                  error={signInErrors.email}
                  autoComplete="email"
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <InputField
                    label=""
                    icon={Lock}
                    type={showSignInPwd ? 'text' : 'password'}
                    id="signin-password"
                    placeholder="••••••••"
                    value={signInForm.password}
                    onChange={(e) => { setSignInForm(p => ({ ...p, password: e.target.value })); setSignInErrors(p => ({ ...p, password: '' })); clearBanners(); }}
                    error={signInErrors.password}
                    autoComplete="current-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowSignInPwd(v => !v)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                        tabIndex={-1}
                        aria-label={showSignInPwd ? 'Hide password' : 'Show password'}
                      >
                        {showSignInPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <div
                    onClick={() => setRememberMe(v => !v)}
                    className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all cursor-pointer ${
                      rememberMe ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white group-hover:border-emerald-400'
                    }`}
                  >
                    {rememberMe && (
                      <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-600">Remember me for 30 days</span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  id="signin-submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 mt-2"
                >
                  {loading === 'email' ? (
                    <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                  ) : 'Sign in'}
                </button>
              </form>

              <Divider />

              <div className="flex gap-3">
                <SocialButton
                  icon={Globe}
                  label="Google"
                  onClick={handleGoogle}
                  disabled={isLoading}
                  iconColor="text-[#4285F4]"
                />
                <SocialButton
                  icon={Phone}
                  label="Mobile"
                  onClick={handlePhone}
                  disabled={isLoading}
                  iconColor="text-emerald-500"
                />
              </div>

              <p className="text-center text-xs text-slate-400 font-medium mt-5">
                No account?{' '}
                <button
                  onClick={() => switchView('signup')}
                  className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors"
                >
                  Create one free
                </button>
              </p>
            </>
          )}

          {/* ══════════════════════════════════
              SIGN UP VIEW
          ══════════════════════════════════ */}
          {view === 'signup' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Begin your journey</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Join thousands of MBM students learning smarter</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                <InputField
                  label="Full Name"
                  icon={User}
                  type="text"
                  id="signup-fullname"
                  placeholder="Your full name"
                  value={signUpForm.fullName}
                  onChange={(e) => { setSignUpForm(p => ({ ...p, fullName: e.target.value })); setSignUpErrors(p => ({ ...p, fullName: '' })); clearBanners(); }}
                  error={signUpErrors.fullName}
                  autoComplete="name"
                />

                <InputField
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  id="signup-email"
                  placeholder="you@example.com"
                  value={signUpForm.email}
                  onChange={(e) => { setSignUpForm(p => ({ ...p, email: e.target.value })); setSignUpErrors(p => ({ ...p, email: '' })); clearBanners(); }}
                  error={signUpErrors.email}
                  autoComplete="email"
                />

                <div>
                  <InputField
                    label="Password"
                    icon={Lock}
                    type={showSignUpPwd ? 'text' : 'password'}
                    id="signup-password"
                    placeholder="Min 8 chars, number required"
                    value={signUpForm.password}
                    onChange={(e) => { setSignUpForm(p => ({ ...p, password: e.target.value })); setSignUpErrors(p => ({ ...p, password: '' })); clearBanners(); }}
                    error={signUpErrors.password}
                    autoComplete="new-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowSignUpPwd(v => !v)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                        tabIndex={-1}
                        aria-label={showSignUpPwd ? 'Hide password' : 'Show password'}
                      >
                        {showSignUpPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <PasswordStrengthBar password={signUpForm.password} />
                </div>

                <div>
                  <InputField
                    label="Confirm Password"
                    icon={ShieldCheck}
                    type={showConfirmPwd ? 'text' : 'password'}
                    id="signup-confirm-password"
                    placeholder="Repeat your password"
                    value={signUpForm.confirmPassword}
                    onChange={(e) => { setSignUpForm(p => ({ ...p, confirmPassword: e.target.value })); setSignUpErrors(p => ({ ...p, confirmPassword: '' })); clearBanners(); }}
                    error={signUpErrors.confirmPassword}
                    autoComplete="new-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(v => !v)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                        tabIndex={-1}
                        aria-label={showConfirmPwd ? 'Hide confirmation' : 'Show confirmation'}
                      >
                        {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  {/* Inline match indicator */}
                  {signUpForm.confirmPassword && signUpForm.password && !signUpErrors.confirmPassword && (
                    <p className={`mt-1 text-xs font-semibold flex items-center gap-1 ${
                      signUpForm.password === signUpForm.confirmPassword ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {signUpForm.password === signUpForm.confirmPassword
                        ? <><CheckCircle2 size={11} /> Passwords match</>
                        : <><AlertCircle size={11} /> Passwords don&apos;t match yet</>
                      }
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                    <div
                      onClick={() => { setTermsAccepted(v => !v); setSignUpErrors(p => ({ ...p, terms: '' })); }}
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 transition-all cursor-pointer ${
                        termsAccepted ? 'bg-emerald-500 border-emerald-500' : `border-slate-300 bg-white group-hover:border-emerald-400 ${signUpErrors.terms ? 'border-red-400' : ''}`
                      }`}
                    >
                      {termsAccepted && (
                        <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-600 leading-relaxed">
                      I agree to the{' '}
                      <a href="#" className="text-emerald-600 font-semibold hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="text-emerald-600 font-semibold hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                  {signUpErrors.terms && (
                    <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1 ml-6.5">
                      <AlertCircle size={11} /> {signUpErrors.terms}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || pwdScore < 2}
                  id="signup-submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 mt-2"
                >
                  {loading === 'email' ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                  ) : 'Create Account'}
                </button>
              </form>

              <Divider />

              <div className="flex gap-3">
                <SocialButton
                  icon={Globe}
                  label="Google"
                  onClick={handleGoogle}
                  disabled={isLoading}
                  iconColor="text-[#4285F4]"
                />
                <SocialButton
                  icon={Phone}
                  label="Mobile"
                  onClick={handlePhone}
                  disabled={isLoading}
                  iconColor="text-emerald-500"
                />
              </div>

              <p className="text-center text-xs text-slate-400 font-medium mt-5">
                Already have an account?{' '}
                <button
                  onClick={() => switchView('signin')}
                  className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors"
                >
                  Sign in
                </button>
              </p>
            </>
          )}

          {/* ══════════════════════════════════
              FORGOT PASSWORD VIEW
          ══════════════════════════════════ */}
          {view === 'forgot' && (
            <>
              <button
                onClick={() => switchView('signin')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-5 group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to Sign In
              </button>

              <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forgot password?</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  No worries — we&apos;ll send a reset link to your email.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                <InputField
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  id="forgot-email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                  error={forgotError}
                  autoComplete="email"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  id="forgot-submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  {loading === 'forgot' ? (
                    <><Loader2 size={16} className="animate-spin" /> Sending…</>
                  ) : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
