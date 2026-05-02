'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import AuthModal from './AuthModal';
import { createClient } from '@/lib/supabase/client';
import { LogOut, ChevronDown, User, Sparkles, Sun, Moon } from 'lucide-react';

/* ── Inline theme toggle — co-located to avoid circular imports ── */
function ThemeToggleInline() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  if (!mounted) return <div className="w-9 h-9 rounded-xl shrink-0" />;

  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
        ${isDark
          ? 'bg-slate-700 border-slate-600 text-amber-400 hover:bg-slate-600'
          : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
        }`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

/**
 * Reads ?login=1 from URL and notifies parent. Wrapped in Suspense because
 * useSearchParams() opts the subtree into client-side rendering.
 */
function NavbarAutoLoginHandler({ onLoginParam }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('login') === '1') {
      onLoginParam(searchParams.get('next') || null);
    }
  }, [searchParams, onLoginParam]);
  return null;
}

export default function Navbar() {
  const [showAuth, setShowAuth] = useState(false);
  const [authTrigger, setAuthTrigger] = useState(null);
  const [authNext, setAuthNext] = useState(null);
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) { setUser(session?.user ?? false); setHydrated(true); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) { setUser(session?.user ?? false); setHydrated(true); }
    });
    return () => { isMounted = false; subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginParam = (next) => { setAuthNext(next); setAuthTrigger('generic'); setShowAuth(true); };
  const openAuth = (trigger = null, next = null) => { setAuthTrigger(trigger); setAuthNext(next); setShowAuth(true); };
  const closeAuth = () => { setShowAuth(false); setAuthTrigger(null); setAuthNext(null); };

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setShowDropdown(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(false);
    window.location.reload();
  };

  const initials = (u) => {
    const name = u?.user_metadata?.full_name || u?.email || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user ? (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User') : '';

  return (
    <>
      <Suspense fallback={null}>
        <NavbarAutoLoginHandler onLoginParam={handleLoginParam} />
      </Suspense>

      <nav className="glass-nav relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 pt-2 sm:pt-0">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group cursor-pointer shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
                <span className="text-lg sm:text-xl font-black">U</span>
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tighter" style={{ color: 'var(--text)' }}>
                Uni<span className="text-emerald-500">notes</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              {[['/', 'Home'], ['/branches', 'Branches'], ['/notes', 'Notes'], ['/prep', 'Test Prep'], ['/about', 'About']].map(([href, label]) => (
                <Link key={href} href={href}
                  className="text-sm font-semibold hover:text-emerald-500 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >{label}</Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/upload"
                className="text-sm font-semibold hover:text-emerald-500 transition-colors hidden sm:block"
                style={{ color: 'var(--text-secondary)' }}
                onClick={(e) => {
                  if (!user && hydrated) { e.preventDefault(); openAuth('upload', '/upload'); }
                }}
              >
                Upload
              </Link>

              {/* Theme Toggle */}
              <ThemeToggleInline />

              {/* Auth area */}
              {!hydrated ? (
                <div className="w-24 h-9 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(v => !v)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border transition-all"
                    style={{ borderColor: 'var(--border)' }}
                    aria-label="User menu"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                      {user.user_metadata?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.user_metadata.avatar_url} alt={displayName} className="w-full h-full object-cover rounded-lg" />
                      ) : initials(user)}
                    </div>
                    <span className="text-sm font-semibold max-w-[80px] truncate hidden sm:block" style={{ color: 'var(--text)' }}>
                      {displayName}
                    </span>
                    <ChevronDown size={14} style={{ color: 'var(--muted)' }}
                      className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showDropdown && (
                    <div
                      className="absolute right-0 mt-2 w-52 rounded-2xl border shadow-2xl py-1.5 animate-scale-up origin-top-right z-50"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <div className="px-4 py-2.5 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                        <p className="text-xs font-black truncate" style={{ color: 'var(--text)' }}>{displayName}</p>
                        <p className="text-xs font-medium truncate mt-0.5" style={{ color: 'var(--muted)' }}>{user.email}</p>
                      </div>

                      <Link href="/profile" onClick={() => setShowDropdown(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold transition-colors hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <User size={14} style={{ color: 'var(--muted)' }} />
                        My Profile
                      </Link>

                      <div className="mt-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openAuth(null, null)}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center justify-between gap-3 pb-3 pt-3 mt-2 overflow-x-auto"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            {[['/', 'Home'], ['/branches', 'Branches'], ['/notes', 'Notes'], ['/prep', 'Test Prep'], ['/about', 'About']].map(([href, label]) => (
              <Link key={href} href={href}
                className="text-sm font-semibold hover:text-emerald-500 transition-colors whitespace-nowrap"
                style={{ color: 'var(--text-secondary)' }}
              >{label}</Link>
            ))}
            <ThemeToggleInline />
          </div>
        </div>
      </nav>

      {/* Guest nudge strip */}
      {hydrated && !user && pathname !== '/' && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles size={13} className="text-amber-400 shrink-0" />
                <p className="text-xs text-slate-300 font-medium truncate">
                  Sign in to upload notes, bookmark papers &amp; unlock all features
                </p>
              </div>
              <button onClick={() => openAuth('generic', null)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0"
              >
                Sign In →
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={closeAuth} trigger={authTrigger} next={authNext} />}
    </>
  );
}
