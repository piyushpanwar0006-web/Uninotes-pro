'use client';
import { useState } from 'react';
import Link from 'next/link';
import AuthModal from './AuthModal';

export default function Navbar() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
<<<<<<< HEAD
      <nav className="glass-nav relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 pt-2 sm:pt-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group cursor-pointer shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-600 transition-colors">
                <span className="text-lg sm:text-xl font-black">U</span>
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900">
=======
      <nav className="glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-600 transition-colors">
                <span className="text-xl font-black">U</span>
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900">
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183
                Uni<span className="text-emerald-500">notes</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Home</Link>
              <Link href="/branches" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Branches</Link>
              <Link href="/notes" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Notes</Link>
              <Link href="/prep" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors">Test Prep</Link>
            </div>

<<<<<<< HEAD
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
=======
            <div className="flex items-center gap-4">
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183
              <Link href="/upload" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors hidden sm:block">
                Upload
              </Link>
              <button
                onClick={() => setShowAuth(true)}
<<<<<<< HEAD
                className="bg-slate-900 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
=======
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183
              >
                Sign In
              </button>
            </div>
          </div>
<<<<<<< HEAD
          
          {/* Mobile Text Navigation Menu */}
          <div className="md:hidden flex items-center justify-between gap-4 pb-3 pt-3 mt-2 border-t border-slate-200/60 overflow-x-auto">
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors whitespace-nowrap">Home</Link>
            <Link href="/branches" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors whitespace-nowrap">Branches</Link>
            <Link href="/notes" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors whitespace-nowrap">Notes</Link>
            <Link href="/prep" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-colors whitespace-nowrap">Test Prep</Link>
          </div>
=======
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
