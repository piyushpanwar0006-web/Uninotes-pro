'use client';
/**
 * GuestNudge — dismissible, non-blocking banner for unauthenticated users.
 *
 * Features:
 *  - Slide-in animation on mount
 *  - Dismisses permanently via localStorage (won't re-appear after close)
 *  - Contextual messaging via `feature` prop
 *  - Does NOT block any action — it is purely informational
 *
 * Props:
 *   feature     — 'bookmark' | 'upload' | 'generic'  (default: 'generic')
 *   onAuthOpen  — callback to open the AuthModal (passes trigger context)
 */
import { useState, useEffect } from 'react';
import { Bookmark, Upload, Sparkles, X } from 'lucide-react';

const DISMISS_KEY = 'uninotes_guest_nudge_dismissed';

const FEATURE_CONFIG = {
  bookmark: {
    icon: Bookmark,
    iconColor: 'text-violet-500',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    title: 'Save notes for later',
    description: 'Sign in to bookmark papers and build your personal study collection.',
  },
  upload: {
    icon: Upload,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    title: 'Contribute to Uninotes',
    description: 'Sign in to upload notes and help your fellow students study smarter.',
  },
  generic: {
    icon: Sparkles,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    title: 'Unlock more features',
    description: 'Sign in to upload notes, bookmark papers, and access your personal dashboard.',
  },
};

export default function GuestNudge({ feature = 'generic', onAuthOpen }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if not previously dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) {
      // Small delay for the slide-in to feel polished
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const handleSignIn = () => {
    onAuthOpen?.(feature);
  };

  if (!visible) return null;

  const config = FEATURE_CONFIG[feature] ?? FEATURE_CONFIG.generic;
  const Icon = config.icon;

  return (
    <div
      className={`
        w-full rounded-2xl border ${config.bgColor} ${config.borderColor}
        px-4 py-3 flex items-center gap-3
        animate-slide-up
      `}
      role="status"
      aria-label="Sign in nudge"
    >
      <div className={`shrink-0 ${config.iconColor}`}>
        <Icon size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">{config.title}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
          {config.description}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleSignIn}
          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold
                     hover:bg-slate-800 active:scale-95 transition-all"
        >
          Sign in
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
