'use client';
/**
 * Reusable skeleton / empty / error shells used by all profile tabs.
 */

export function TabSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading…">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-5 animate-pulse" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ backgroundColor: 'var(--card)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 rounded-full w-3/4" style={{ backgroundColor: 'var(--card)' }} />
              <div className="h-3 rounded-full w-1/3" style={{ backgroundColor: 'var(--card)' }} />
            </div>
            <div className="h-7 w-20 rounded-xl" style={{ backgroundColor: 'var(--card)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ cols = 4, rows = 4 }) {
  return (
    <div className="rounded-2xl border overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* header */}
      <div className="flex gap-4 px-6 py-3.5 border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 rounded-full flex-1" style={{ backgroundColor: 'var(--border)' }} />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={`h-3.5 rounded-full ${j === 0 ? 'flex-[2]' : 'flex-1'}`} style={{ backgroundColor: 'var(--card)' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ emoji = '📭', title, subtitle }) {
  return (
    <div className="rounded-2xl border shadow-sm py-20 flex flex-col items-center gap-4 text-center px-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl select-none" style={{ backgroundColor: 'var(--bg)' }}>
        {emoji}
      </div>
      <div>
        <p className="text-base font-black" style={{ color: 'var(--text)' }}>{title}</p>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export function ErrorBanner({ message }) {
  return (
    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
      <span>⚠️</span>
      {message || 'Something went wrong. Please try again.'}
    </div>
  );
}
