'use client';
import { useState } from 'react';
import { Download, X, BookOpen } from 'lucide-react';
import { useProfileFetch } from '@/lib/hooks/useProfileFetch';
import { TabSkeleton, EmptyState, ErrorBanner } from '@/components/profile/TabShells';

export default function SavedNotesTab() {
  const { data, loading, error, refetch } = useProfileFetch('/api/bookmarks?limit=50');
  const [removing, setRemoving] = useState(null); // bookmark id being removed

  const bookmarks = data?.bookmarks ?? [];
  const total     = data?.pagination?.total ?? 0;

  const handleRemove = async (bookmarkId) => {
    setRemoving(bookmarkId);
    try {
      const res = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) refetch();
    } catch (e) {
      console.error('Remove bookmark failed', e);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>Saved Notes</h2>
        {!loading && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>
            {total} saved
          </span>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <TabSkeleton rows={6} />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          emoji="🔖"
          title="No saved notes yet"
          subtitle="Bookmark notes while browsing to find them here."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {bookmarks.map((bk) => (
            <SavedCard
              key={bk.id}
              bookmark={bk}
              removing={removing === bk.id}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedCard({ bookmark, removing, onRemove }) {
  const paper   = bookmark.resource;
  const title   = paper?.title            ?? 'Unknown Resource';
  const subject = paper?.subjects?.name   ?? '—';
  const branch  = paper?.subjects?.branch ?? '';

  return (
    <div className="group rounded-2xl border shadow-sm p-5 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400 transition-all duration-200" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Icon + Quick Remove */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-100 dark:ring-emerald-900/50 flex-shrink-0">
          <BookOpen size={18} />
        </div>
        <button
          aria-label="Remove bookmark"
          disabled={removing}
          onClick={() => onRemove(bookmark.id)}
          className="p-1.5 rounded-lg hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-150 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: 'var(--muted)' }}
        >
          {removing ? (
            <span className="w-3.5 h-3.5 border-2 border-red-300/40 border-t-red-400 rounded-full animate-spin block" />
          ) : (
            <X size={14} />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>{title}</h3>
        <p className="text-xs font-medium mt-1" style={{ color: 'var(--muted)' }}>
          {subject}{branch ? ` • ${branch}` : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        {paper?.id ? (
          <a
            href={`/api/papers/${paper.id}/signed-url`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Download ${title}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <Download size={13} />
            Download
          </a>
        ) : (
          <span className="flex-1 text-center text-xs" style={{ color: 'var(--muted)' }}>Unavailable</span>
        )}
        <button
          aria-label={`Remove ${title} from saved`}
          disabled={removing}
          onClick={() => onRemove(bookmark.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors border hover:border-red-400 disabled:opacity-50"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
        >
          <X size={13} />
          Remove
        </button>
      </div>
    </div>
  );
}
