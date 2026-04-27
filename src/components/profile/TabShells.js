'use client';
/**
 * Reusable skeleton / empty / error shells used by all profile tabs.
 */

export function TabSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading…">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
              <div className="h-3 bg-slate-100 rounded-full w-1/3" />
            </div>
            <div className="h-7 w-20 bg-slate-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ cols = 4, rows = 4 }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden animate-pulse">
      {/* header */}
      <div className="flex gap-4 px-6 py-3.5 bg-slate-50 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded-full flex-1" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-6 py-4 border-b border-slate-50">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={`h-3.5 bg-slate-100 rounded-full ${j === 0 ? 'flex-[2]' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ emoji = '📭', title, subtitle }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm py-20 flex flex-col items-center gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl select-none">
        {emoji}
      </div>
      <div>
        <p className="text-base font-black text-slate-700">{title}</p>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export function ErrorBanner({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium flex items-center gap-2">
      <span>⚠️</span>
      {message || 'Something went wrong. Please try again.'}
    </div>
  );
}
