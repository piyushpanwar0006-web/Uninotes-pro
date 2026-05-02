'use client';
import { useState, useMemo } from 'react';
import { Edit2, Trash2, ChevronDown } from 'lucide-react';
import { useProfileFetch } from '@/lib/hooks/useProfileFetch';
import { TableSkeleton, EmptyState, ErrorBanner } from '@/components/profile/TabShells';

// ── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  ready:      { label: 'Approved', css: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/50' },
  processing: { label: 'Pending',  css: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/50'   },
  failed:     { label: 'Rejected', css: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900/50'          },
};

const ALL_STATUSES = ['All Status', 'Approved', 'Pending', 'Rejected'];
const ALL_SEMS     = ['All Semesters', '1', '2', '3', '4', '5', '6', '7', '8'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function statusLabel(s) { return STATUS_CONFIG[s]?.label ?? s; }
function statusCss(s)   { return STATUS_CONFIG[s]?.css   ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'; }

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function UploadsTab() {
  const { data, loading, error, refetch } = useProfileFetch('/api/me/uploads?limit=50');

  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [semFilter,     setSemFilter]     = useState('All Semesters');
  const [statusFilter,  setStatusFilter]  = useState('All Status');
  const [deleting,      setDeleting]      = useState(null); // paper id being deleted

  const uploads = data?.uploads ?? [];

  // Derive unique subjects from real data for the filter dropdown
  const allSubjects = useMemo(() => {
    const names = uploads.map((u) => u.subjects?.name).filter(Boolean);
    return ['All Subjects', ...Array.from(new Set(names)).sort()];
  }, [uploads]);

  const filtered = useMemo(() => uploads.filter((u) => {
    if (subjectFilter !== 'All Subjects' && u.subjects?.name !== subjectFilter) return false;
    if (semFilter     !== 'All Semesters' && String(u.subjects?.semester) !== semFilter) return false;
    if (statusFilter  !== 'All Status'    && statusLabel(u.status) !== statusFilter) return false;
    return true;
  }), [uploads, subjectFilter, semFilter, statusFilter]);

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = async (paperId) => {
    if (!confirm('Delete this upload? This cannot be undone.')) return;
    setDeleting(paperId);
    try {
      const res = await fetch(`/api/papers/${paperId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) refetch();
    } catch (e) {
      console.error('Delete failed', e);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>My Uploads</h2>
        {!loading && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>
            {filtered.length} {filtered.length === 1 ? 'note' : 'notes'}
          </span>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Filters */}
      <div className="rounded-2xl border shadow-sm p-4 flex flex-wrap gap-3" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <FilterSelect label="Subject"  value={subjectFilter} options={allSubjects}  onChange={setSubjectFilter} />
        <FilterSelect label="Semester" value={semFilter}     options={ALL_SEMS}      onChange={setSemFilter} />
        <FilterSelect label="Status"   value={statusFilter}  options={ALL_STATUSES}  onChange={setStatusFilter} />
      </div>

      {/* Desktop Table */}
      {loading ? (
        <TableSkeleton cols={5} rows={4} />
      ) : (
        <>
          <div className="hidden sm:block rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                  <Th>Title</Th>
                  <Th>Subject</Th>
                  <Th>Downloads</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-sm font-medium" style={{ color: 'var(--muted)' }}>
                      {uploads.length === 0 ? 'You haven\'t uploaded any notes yet.' : 'No uploads match the selected filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="transition-colors hover-lift">
                      <td className="px-6 py-4">
                        <div className="font-semibold max-w-[220px] truncate" style={{ color: 'var(--text)' }}>{u.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{fmtDate(u.created_at)}</div>
                      </td>
                      <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {u.subjects?.name ?? '—'}
                      </td>
                      <td className="px-4 py-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {(u.download_count ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-4">
                        <ActionButtons
                          paperId={u.id}
                          deleting={deleting === u.id}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {filtered.length === 0 ? (
              <EmptyState
                emoji="📤"
                title={uploads.length === 0 ? "No uploads yet" : "No matches"}
                subtitle={uploads.length === 0 ? "Upload your first note to see it here." : "Try changing the filters."}
              />
            ) : (
              filtered.map((u) => (
                <div key={u.id} className="rounded-2xl border shadow-sm p-4 space-y-3" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text)' }}>{u.title}</p>
                    <StatusBadge status={u.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'var(--text-secondary)' }}>
                    <span>{u.subjects?.name ?? '—'}</span>
                    {u.subjects?.semester && <span>• Sem {u.subjects.semester}</span>}
                    <span>• {(u.download_count ?? 0)} downloads</span>
                    <span>• {fmtDate(u.created_at)}</span>
                  </div>
                  <div className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                    <ActionButtons
                      paperId={u.id}
                      deleting={deleting === u.id}
                      onDelete={handleDelete}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Th({ children }) {
  return (
    <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3.5 first:px-6" style={{ color: 'var(--muted)' }}>
      {children}
    </th>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border text-xs font-semibold px-3 py-2 pr-7 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all hover:border-emerald-400"
        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusCss(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

function ActionButtons({ paperId, deleting, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Edit upload"
        disabled
        title="Edit coming soon"
        className="p-1.5 rounded-lg cursor-not-allowed"
        style={{ color: 'var(--muted)' }}
      >
        <Edit2 size={14} />
      </button>
      <button
        aria-label="Delete upload"
        disabled={deleting}
        onClick={() => onDelete(paperId)}
        className="p-1.5 rounded-lg hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {deleting ? (
          <span className="w-3.5 h-3.5 border-2 border-red-400/40 border-t-red-500 rounded-full animate-spin block" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>
    </div>
  );
}
