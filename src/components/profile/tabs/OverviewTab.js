'use client';
import { useState, useEffect } from 'react';
import { Upload, Download, Bookmark, TrendingUp } from 'lucide-react';

// ── Relative time helper ────────────────────────────────────────────────────
function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  const weeks = Math.floor(days / 7);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins} min${mins > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7)   return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 5)  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const ACTION_DOT = {
  Uploaded:   'bg-emerald-500',
  Downloaded: 'bg-blue-500',
  Bookmarked: 'bg-amber-500',
};

// ── Skeleton loader ─────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl ${className}`} style={{ backgroundColor: 'var(--card)' }} />;
}

export default function OverviewTab({ user }) {
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── State ──────────────────────────────────────────────────────────────
  const [stats, setStats]       = useState(null);
  const [savedCount, setSaved]  = useState(null);
  const [activity, setActivity] = useState(null);
  const [error, setError]       = useState(null);

  // ── Fetch all overview data in parallel ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsRes, bookmarksRes, activityRes] = await Promise.all([
          fetch('/api/me/stats',           { credentials: 'include', cache: 'no-store' }),
          fetch('/api/bookmarks?limit=1',  { credentials: 'include', cache: 'no-store' }),
          fetch('/api/me/recent-activity', { credentials: 'include', cache: 'no-store' }),
        ]);

        if (cancelled) return;

        // Stats (uploads + downloads received)
        if (statsRes.ok) {
          const j = await statsRes.json();
          if (j.success) setStats(j.data);
        }

        // Bookmarks count
        if (bookmarksRes.ok) {
          const j = await bookmarksRes.json();
          if (j.success) setSaved(j.data?.pagination?.total ?? 0);
        }

        // Recent activity
        if (activityRes.ok) {
          const j = await activityRes.json();
          if (j.success) setActivity(j.data?.activity ?? []);
        }
      } catch (e) {
        if (!cancelled) setError('Could not load profile data.');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Derive this-month uploads from activity (rough indicator)
  const thisMonthUploads = activity
    ? activity.filter((a) => {
        if (a.action !== 'Uploaded') return false;
        const d = new Date(a.time);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length
    : null;

  const STAT_CARDS = [
    {
      label: 'Uploads',
      value: stats?.totalUploads ?? null,
      icon: Upload,
      color: 'bg-emerald-50 text-emerald-600',
      ring: 'ring-emerald-100',
    },
    {
      label: 'Downloads Received',
      value: stats?.totalDownloads ?? null,
      icon: Download,
      color: 'bg-blue-50 text-blue-600',
      ring: 'ring-blue-100',
    },
    {
      label: 'Saved Notes',
      value: savedCount,
      icon: Bookmark,
      color: 'bg-amber-50 text-amber-600',
      ring: 'ring-amber-100',
    },
    {
      label: 'Uploads This Month',
      value: thisMonthUploads,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      ring: 'ring-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 rounded-2xl p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-12 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-emerald-400 font-semibold text-sm tracking-wide mb-1">{greeting} 👋</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            Welcome back, <br className="sm:hidden" />
            <span className="text-emerald-400">{name}</span>!
          </h1>
          <p className="text-slate-400 text-sm mt-3 max-w-md">
            Keep contributing to the UniNote community. Your uploads help hundreds of students prepare better.
          </p>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* ── Stats Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, ring }) => (
          <div
            key={label}
            className="rounded-2xl border shadow-sm p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform duration-200"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className={`w-10 h-10 rounded-xl ${color} ring-2 ${ring} flex items-center justify-center`}>
              <Icon size={18} />
            </div>
            <div>
              {value === null ? (
                <Skeleton className="h-7 w-10 mb-1" />
              ) : (
                <p className="text-2xl font-black" style={{ color: 'var(--text)' }}>{value.toLocaleString()}</p>
              )}
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Activity ────────────────────────────────────────────── */}
      <div className="rounded-2xl border shadow-sm p-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text)' }}>Recent Activity</h3>

        {activity === null ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">🌱</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No activity yet.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Upload or download a note to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${ACTION_DOT[item.action] ?? 'bg-slate-400 dark:bg-slate-500'}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug truncate" style={{ color: 'var(--text)' }}>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{item.action} • </span>
                    {item.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{relativeTime(item.time)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
