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
        <h2 className="text-lg font-black text-slate-900">Download History</h2>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {total} {total === 1 ? 'download' : 'downloads'}
            </span>
          )}
          <button
            onClick={() => setSortAsc((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 bg-white border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl transition-all duration-200"
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
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <Th>Title</Th>
                  <Th>Subject</Th>
                  <Th>Date</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {downloads.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 max-w-[240px] truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-4 text-slate-500">{item.subject}</td>
                    <td className="px-4 py-4 text-slate-400 text-xs">{fmtDate(item.downloaded_at)}</td>
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
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
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
    <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider px-4 py-3.5 first:px-6">
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
          ? 'shrink-0 p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center'
          : 'flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors'
      }
    >
      <Download size={compact ? 15 : 13} />
      {!compact && 'Download'}
    </a>
  );
}
