'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BranchCatalog from '@/components/BranchCatalog';
import HomeSearch from '@/components/HomeSearch';
import AuthModal from '@/components/AuthModal';
import { Users, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { WhyUninotes, Testimonials, FAQ, BlogPreview } from '@/components/HomeSections';

function ParamHandler({ onLogin, onAuthError }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const login = searchParams.get('login');
    const next  = searchParams.get('next');
    const error = searchParams.get('authError');

    if (login === '1') onLogin(next || null);
    if (error === 'true') onAuthError('Google sign-in failed. Please try again or use email sign-in.');

    if (login || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete('login');
      url.searchParams.delete('next');
      url.searchParams.delete('authError');
      router.replace(url.pathname + (url.search !== '?' ? url.search : ''));
    }
  }, [searchParams, onLogin, onAuthError, router]);

  return null;
}

export default function Home() {
  const [searchActive, setSearchActive] = useState(false);
  const [showAuth, setShowAuth]         = useState(false);
  const [authTrigger, setAuthTrigger]   = useState(null);
  const [authNext, setAuthNext]         = useState(null);
  const [authError, setAuthError]       = useState('');

  const handleLogin       = useCallback((next) => { setAuthNext(next); setAuthTrigger('generic'); setShowAuth(true); }, []);
  const handleAuthError   = useCallback((msg) => setAuthError(msg), []);
  const handleCloseAuth   = useCallback(() => { setShowAuth(false); setAuthTrigger(null); setAuthNext(null); }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Suspense fallback={null}>
        <ParamHandler onLogin={handleLogin} onAuthError={handleAuthError} />
      </Suspense>

      <Navbar onSignInClick={() => { setAuthTrigger('generic'); setShowAuth(true); }} />

      {/* Auth error toast */}
      {authError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-red-600 text-white rounded-2xl shadow-xl text-sm font-semibold animate-fade-in max-w-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{authError}</span>
          <button onClick={() => setAuthError('')} className="ml-2 hover:opacity-70 font-black">✕</button>
        </div>
      )}

      {showAuth && <AuthModal onClose={handleCloseAuth} trigger={authTrigger} next={authNext} />}

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-emerald-500/5 to-transparent -z-10 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-8 animate-fade-in"
              style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Built for MBM Students
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1] animate-fade-in stagger-1" style={{ color: 'var(--text)' }}>
              Study Smarter, <br />
              <span className="text-gradient">Not Harder.</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg md:text-xl mb-12 font-medium leading-relaxed animate-fade-in stagger-2" style={{ color: 'var(--text-secondary)' }}>
              Access the most comprehensive collection of engineering notes,
              PYQs, and resource guides curated by the MBM community.
            </p>

            <div className="max-w-2xl mx-auto flex justify-center w-full">
              <HomeSearch onActiveChange={setSearchActive} />
            </div>

            <div className={`mt-12 flex flex-wrap justify-center items-center gap-8 md:gap-12 transition-all duration-300 ${searchActive ? 'opacity-0 pointer-events-none' : 'opacity-60 hover:opacity-100'}`}>
              <div className="flex items-center gap-2">
                <Star className="text-yellow-500 fill-yellow-500 w-4 h-4" />
                <span className="font-bold" style={{ color: 'var(--text)' }}>Verified by Seniors &amp; Toppers</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-emerald-500 w-4 h-4" />
                <span className="font-bold" style={{ color: 'var(--text)' }}>Notes shared by real students</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-blue-500 w-4 h-4" />
                <span className="font-bold" style={{ color: 'var(--text)' }}>All MBM Branches Covered</span>
              </div>
            </div>
          </div>
        </section>

        {/* Branch Catalog */}
        <section className="py-24 sm:py-32 rounded-t-[3rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.07)]" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-20">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight lg:text-5xl mb-6" style={{ color: 'var(--text)' }}>
                Explore <span className="text-emerald-500">Branches</span>
              </h2>
              <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                Choose your engineering pathway to access comprehensive notes and practice materials.
              </p>
            </div>
            <BranchCatalog limit={8} />
          </div>
        </section>

        {/* Stats */}
        <section className="py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -z-0" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <div className="text-5xl font-black text-white">NOTES</div>
                <div className="text-emerald-400 font-bold tracking-widest uppercase text-sm">Made for MBM Exams</div>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">FREE</div>
                <div className="text-emerald-400 font-bold tracking-widest uppercase text-sm">Easy to Search &amp; Download</div>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-black text-white">MBM</div>
                <div className="text-emerald-400 font-bold tracking-widest uppercase text-sm">Focused on MBM Syllabus</div>
              </div>
            </div>
          </div>
        </section>

        <WhyUninotes />
        <Testimonials />
        <FAQ />
        <BlogPreview />
      </main>

      <Footer />
    </div>
  );
}
