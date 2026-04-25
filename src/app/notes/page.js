'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  FileText, Clock, HardDrive, User, BookOpen,
  AlertCircle, Loader2, Eye, Upload, Search, X,
  ChevronRight, BookMarked, Trash2, CheckCircle2, WifiOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────
// Toast Notification System
// ─────────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-auto animate-slide-up max-w-sm ${
            t.type === 'success'
              ? 'bg-emerald-600 text-white'
              : t.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-slate-800 text-white'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 size={16} className="shrink-0" />}
          {t.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
          {t.type === 'info' && <Loader2 size={16} className="animate-spin shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="opacity-70 hover:opacity-100 ml-2">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef({});

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      timerRef.current[id] = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        delete timerRef.current[id];
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timerRef.current[id]) {
      clearTimeout(timerRef.current[id]);
      delete timerRef.current[id];
    }
  }, []);

  return { toasts, addToast, removeToast };
}

// ─────────────────────────────────────────────────────────────
// Delete Confirmation Modal
// ─────────────────────────────────────────────────────────────
function DeleteModal({ paper, onConfirm, onCancel, loading }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,17,34,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-scale-up">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h2 className="text-xl font-black text-slate-900 text-center mb-2">Delete Note?</h2>
        <p className="text-sm text-slate-500 text-center mb-2 font-medium">
          You are about to permanently delete:
        </p>
        <p className="text-sm font-bold text-slate-800 text-center mb-6 bg-slate-50 rounded-xl px-4 py-2 line-clamp-2">
          "{paper.title}"
        </p>
        <p className="text-xs text-red-500 text-center mb-6 font-medium">
          ⚠️ This will remove the file from the database and storage. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Deleting…</>
              : <><Trash2 size={14} /> Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Paper Card
// ─────────────────────────────────────────────────────────────
function PaperCard({ paper, onDelete, addToast }) {
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewError, setViewError] = useState('');

  const subject = paper.subjects;
  const uploader = paper.users;

  // View PDF
  const handleView = async () => {
    setViewError('');
    setViewLoading(true);
    try {
      const res = await fetch(`/api/papers/${paper.id}/signed-url`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!json.success) {
        const msg = res.status === 401
          ? 'Please sign in to view this PDF.'
          : (json.error || 'Failed to get PDF link. The file may have been removed.');
        setViewError(msg);
        return;
      }
      window.open(json.data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setViewError('Network error. Please check your connection.');
    } finally {
      setViewLoading(false);
    }
  };

  // Confirm and execute delete
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/papers/${paper.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      let json;
      try {
        json = await res.json();
      } catch {
        addToast(`Server error (HTTP ${res.status}). Please try again.`, 'error');
        setShowDeleteModal(false);
        return;
      }

      if (res.ok && json.success) {
        setShowDeleteModal(false);
        addToast('Note deleted successfully.', 'success');
        // Instantly remove card from parent list — no reload needed
        if (onDelete) onDelete(paper.id);
      } else {
        setShowDeleteModal(false);
        addToast(json.error || `Delete failed (HTTP ${res.status}). Try again.`, 'error');
      }
    } catch {
      setShowDeleteModal(false);
      addToast('Network error. Could not delete. Please try again.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col gap-4 group relative">

        {/* Delete Button — admin sees on ALL notes, user sees only on their own */}
        {paper.canDelete && (
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={viewLoading}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all z-10 disabled:opacity-30"
            title="Delete this note"
          >
            <Trash2 size={16} />
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
            <FileText size={22} className="text-emerald-600" strokeWidth={1.5} />
          </div>
          <div className="flex-grow min-w-0 pr-8">
            <h3 className="font-black text-slate-900 text-[15px] leading-snug mb-1 line-clamp-2">
              {paper.title}
            </h3>
            {paper.description && (
              <p className="text-xs text-slate-500 font-medium line-clamp-2">{paper.description}</p>
            )}
          </div>
        </div>

        {/* Subject badge */}
        {subject && (
          <a
            href={`/subjects/${subject.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all self-start"
          >
            <BookOpen size={11} className="text-emerald-600" />
            <span className="text-[11px] font-black text-slate-600 tracking-wide">{subject.name}</span>
            {subject.semester && (
              <span className="text-[10px] text-slate-400 font-bold">· Sem {subject.semester}</span>
            )}
          </a>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1"><Clock size={11} />{formatDate(paper.created_at)}</span>
          <span className="flex items-center gap-1"><HardDrive size={11} />{formatBytes(paper.size_bytes)}</span>
          {uploader?.full_name && (
            <span className="flex items-center gap-1"><User size={11} />{uploader.full_name}</span>
          )}
          <span className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">PDF</span>
        </div>

        {/* View error (only shown for view action failures) */}
        {viewError && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <AlertCircle size={12} className="shrink-0" />
            {viewError}
            <button
              onClick={() => setViewError('')}
              className="ml-auto text-amber-500 hover:text-amber-700"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* View PDF button */}
        <button
          onClick={handleView}
          disabled={viewLoading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-auto"
        >
          {viewLoading
            ? <><Loader2 size={12} className="animate-spin" /> Opening…</>
            : <><Eye size={12} /> View PDF</>
          }
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          paper={paper}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleteLoading && setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Notes Page
// ─────────────────────────────────────────────────────────────
export default function NotesPage() {
  const [papers, setPapers] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const { toasts, addToast, removeToast } = useToast();
  const supabase = createClient();
  const LIMIT = 12;

  // ── Fetch papers ───────────────────────────────────────────
  const fetchPapers = useCallback(async (pg = 1) => {
    setPageLoading(true);
    setPageError('');
    try {
      const res = await fetch(`/api/papers?page=${pg}&limit=${LIMIT}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (!json.success) {
        setPageError(json.error || 'Failed to load notes.');
        return;
      }
      setPapers(json.data.papers ?? []);
      setTotalPages(json.data.pagination?.totalPages ?? 1);
      setTotal(json.data.pagination?.total ?? 0);
    } catch {
      setPageError('Network error. Please check your connection.');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { fetchPapers(page); }, [fetchPapers, page]);

  // ── Fetch user session + role ──────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setUserRole(profile?.role ?? 'user');
      } catch {
        // User not logged in — canDelete will be false for all
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Permission mapping ─────────────────────────────────────
  const papersWithPermissions = papers.map(p => ({
    ...p,
    // Admin → delete ALL; User → delete ONLY their own
    canDelete: userRole === 'admin' || (!!currentUser?.id && currentUser.id === p.uploaded_by),
  }));

  // ── Instantly remove deleted paper from state ──────────────
  const handlePaperDeleted = useCallback((deletedId) => {
    setPapers(prev => prev.filter(p => p.id !== deletedId));
    setTotal(prev => Math.max(0, prev - 1));
  }, []);

  // ── Pagination ─────────────────────────────────────────────
  const handlePage = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Client-side search ─────────────────────────────────────
  const filtered = search.trim()
    ? papersWithPermissions.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.subjects?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.subjects?.branch?.toLowerCase().includes(search.toLowerCase())
      )
    : papersWithPermissions;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="bg-slate-900 pt-16 pb-28 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] -z-0" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] -z-0" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
              <a href="/" className="hover:text-emerald-400 transition-colors">Home</a>
              <ChevronRight size={12} />
              <span className="text-slate-300">Study Notes</span>
            </nav>

            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                  <BookMarked size={30} />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                    Study <span className="text-emerald-400">Notes</span>
                  </h1>
                  <p className="text-slate-400 font-medium mt-1">
                    All uploaded resources, sorted by newest first
                  </p>
                </div>
              </div>

              <a
                href="/upload"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <Upload size={15} /> Upload PDF
              </a>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20 pb-24">
          {/* Search + Stats */}
          <div className="glass-card px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
            {!pageLoading && !pageError && (
              <p className="text-sm font-bold text-slate-600 shrink-0">
                {total} {total === 1 ? 'note' : 'notes'} available
                {userRole === 'admin' && (
                  <span className="ml-2 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider">Admin</span>
                )}
              </p>
            )}
            <div className="relative flex-grow">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, subject, or branch…"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {pageLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-400">
              <Loader2 size={36} className="animate-spin text-emerald-500" />
              <p className="font-bold text-sm">Loading notes…</p>
            </div>
          )}

          {/* Page-level Error */}
          {!pageLoading && pageError && (
            <div className="glass-card p-10 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff size={26} className="text-red-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Could not load notes</h2>
              <p className="text-slate-500 font-medium mb-6">{pageError}</p>
              <button
                onClick={() => fetchPapers(page)}
                className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!pageLoading && !pageError && filtered.length === 0 && (
            <div className="glass-card p-14 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText size={30} className="text-slate-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">
                {search ? 'No results found' : 'No notes uploaded yet'}
              </h2>
              <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                {search
                  ? `No notes matched "${search}". Try a different term.`
                  : 'Be the first to contribute! Upload your notes and help the community.'}
              </p>
              {!search && (
                <a
                  href="/upload"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Upload size={15} /> Upload a PDF
                </a>
              )}
            </div>
          )}

          {/* Notes Grid */}
          {!pageLoading && !pageError && filtered.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    onDelete={handlePaperDeleted}
                    addToast={addToast}
                  />
                ))}
              </div>

              {/* Pagination */}
              {!search && totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button
                    onClick={() => handlePage(page - 1)}
                    disabled={page === 1}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm font-bold text-slate-500 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePage(page + 1)}
                    disabled={page === totalPages}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />

      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
