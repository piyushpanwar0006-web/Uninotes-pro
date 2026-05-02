'use client';
import { useState } from 'react';
import { Download, ArrowUpDown } from 'lucide-react';
import { useProfileFetch } from '@/lib/hooks/useProfileFetch';
import { TableSkeleton, EmptyState, ErrorBanner } from '@/components/profile/TabShells';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function DownloadsTab() {
  const [sortAsc, setSortAsc] = useState(false);
  const url = `/api/me/download-history?limit=50&sort=${sortAsc ? 'asc' : 'desc'}`;
  const { data, loading, error } = useProfileFetch(url);

  const downloads = data?.downloads ?? [];
  const total     = data?.pagination?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>Download History</h2>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>
              {total} {total === 1 ? 'download' : 'downloads'}
            </span>
          )}
          <button
            onClick={() => setSortAsc((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold hover:text-emerald-600 hover:border-emerald-300 px-3 py-1.5 rounded-xl transition-all duration-200 border"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            aria-label="Toggle sort order"
          >
            <ArrowUpDown size={13} />
            {sortAsc ? 'Oldest first' : 'Latest first'}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <TableSkeleton cols={4} rows={5} />
      ) : downloads.length === 0 ? (
        <EmptyState
          emoji="📥"
          title="No downloads yet"
          subtitle="Files you download will appear here."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                  <Th>Title</Th>
                  <Th>Subject</Th>
                  <Th>Date</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
                {downloads.map((item) => (
                  <tr key={item.id} className="transition-colors hover-lift">
                    <td className="px-6 py-4 font-semibold max-w-[240px] truncate" style={{ color: 'var(--text)' }}>
                      {item.title}
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--text-secondary)' }}>{item.subject}</td>
                    <td className="px-4 py-4 text-xs" style={{ color: 'var(--muted)' }}>{fmtDate(item.downloaded_at)}</td>
                    <td className="px-4 py-4">
                      <DownloadButton paperId={item.paper_id} title={item.title} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {downloads.map((item) => (
              <div key={item.id} className="rounded-2xl border shadow-sm p-4 flex items-start justify-between gap-3" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {item.subject} • {fmtDate(item.downloaded_at)}
                  </p>
                </div>
                <DownloadButton paperId={item.paper_id} title={item.title} compact />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3.5 first:px-6" style={{ color: 'var(--muted)' }}>
      {children}
    </th>
  );
}

function DownloadButton({ paperId, title, compact = false }) {
  if (!paperId) return null;
  return (
    <a
      href={`/api/papers/${paperId}/signed-url`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Re-download ${title}`}
      className={
        compact
          ? 'shrink-0 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors flex items-center justify-center'
          : 'flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded-xl transition-colors'
      }
    >
      <Download size={compact ? 15 : 13} />
      {!compact && 'Download'}
    </a>
  );
}
