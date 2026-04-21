'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import AuthModal from './AuthModal';
import { createClient } from '@/lib/supabase/client';
import { LogOut, ChevronDown, User, Sparkles } from 'lucide-react';

/**
 * Isolated component that reads ?login=1 from the URL and notifies the
 * parent Navbar to open the auth modal. Must be wrapped in <Suspense> because
 * useSearchParams() opts the subtree into client-side rendering.
 */
function NavbarAutoLoginHandler({ onLoginParam }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get('login') === '1') {
      const next = searchParams.get('next') || null;
      onLoginParam(next);
    }
  }, [searchParams, onLoginParam]);

  return null; // Renders nothing — side-effect only
}

export default function Navbar() {
  const [showAuth, setShowAuth] = useState(false);
  const [authTrigger, setAuthTrigger] = useState(null);
  const [authNext, setAuthNext] = useState(null);
  const [user, setUser] = useState(null);          // null = loading | false = logged out | object = logged in
  const [hydrated, setHydrated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const supabase = createClient();
  const pathname = usePathname();

  /* ── Fetch session on mount & subscribe to auth changes ── */
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setUser(session?.user ?? false);
        setHydrated(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? false);
        setHydrated(true);
      }
    });

    return () => { isMounted = false; subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Auto-open auth modal when middleware redirects with ?login=1 ── */
  // Handled by <NavbarAutoLoginHandler> below (requires Suspense for useSearchParams)
  const handleLoginParam = (next) => {
    setAuthNext(next);
    setAuthTrigger('generic');
    setShowAuth(true);
  };

  /* ── Open auth modal with a specific feature trigger ── */
  const openAuth = (trigger = null, next = null) => {
    setAuthTrigger(trigger);
    setAuthNext(next);
    setShowAuth(true);
  };

  const closeAuth = () => {
    setShowAuth(false);
    setAuthTrigger(null);
    setAuthNext(null);
  };

  /* ── Close dropdown when clicking outside ── */
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── Logout ── */
  const handleLogout = async () => {
    setShowDropdown(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(false);
    window.location.reload();
  };

  /* ── User initials ── */
  const initials = (user) => {
    const name = user?.user_metadata?.full_name || user?.email || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user ? (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User') : '';

  return (
    <>
      {/* Suspense-safe handler for ?login=1 query param from middleware redirects */}
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
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900">
                Uni<span className="text-emerald-500">notes</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Home</Link>
              <Link href="/branches" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Branches</Link>
              <Link href="/notes" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Notes</Link>
              <Link href="/prep" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Test Prep</Link>
            </div>

            {/* Right side: auth */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <Link href="/upload" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors hidden sm:block"
                onClick={(e) => {
                  if (!user && hydrated) {
                    e.preventDefault();
                    openAuth('upload', '/upload');
                  }
                }}
              >
                Upload
              </Link>

              {/* Not yet hydrated: placeholder to avoid layout shift */}
              {!hydrated ? (
                <div className="w-24 h-9 rounded-xl bg-slate-100 animate-pulse" />
              ) : user ? (
                /* ── Signed-in user avatar + dropdown ── */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(v => !v)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                    aria-label="User menu"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                      {user.user_metadata?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.user_metadata.avatar_url}
                          alt={displayName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : initials(user)}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 max-w-[80px] truncate hidden sm:block">
                      {displayName}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 py-1.5 animate-scale-up origin-top-right z-50">
                      {/* User info */}
                      <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                        <p className="text-xs font-black text-slate-900 truncate">{displayName}</p>
                        <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{user.email}</p>
                      </div>

                      <button
                        onClick={() => { setShowDropdown(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <User size={14} className="text-slate-400" />
                        My Profile
                      </button>

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Sign In button ── */
                <button
                  onClick={() => openAuth(null, null)}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Text Navigation Menu */}
          <div className="md:hidden flex items-center justify-between gap-4 pb-3 pt-3 mt-2 border-t border-slate-200/60 overflow-x-auto">
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors whitespace-nowrap">Home</Link>
            <Link href="/branches" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors whitespace-nowrap">Branches</Link>
            <Link href="/notes" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors whitespace-nowrap">Notes</Link>
            <Link href="/prep" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors whitespace-nowrap">Test Prep</Link>
          </div>
        </div>
      </nav>

      {/* Guest feature nudge strip — shows only when not logged in and not on homepage */}
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
              <button
                onClick={() => openAuth('generic', null)}
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
