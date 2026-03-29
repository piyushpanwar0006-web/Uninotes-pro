'use client';
import { useState } from 'react';
import Link from 'next/link';
import AuthModal from './AuthModal';

export default function Navbar() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <nav className="glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-600 transition-colors">
                <span className="text-xl font-black">U</span>
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900">
                Uni<span className="text-emerald-500">notes</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Home</Link>
              <Link href="/branches" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Branches</Link>
              <Link href="/notes" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Notes</Link>
              <Link href="/prep" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Test Prep</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/upload" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors hidden sm:block">
                Upload
              </Link>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
