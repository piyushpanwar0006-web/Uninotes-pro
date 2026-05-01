'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GuestNudge from '@/components/GuestNudge';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/lib/hooks/useAuth';
import PaperSkeleton from '@/components/PaperSkeleton';
import { Skeleton } from '@/components/ui/Skeleton';
import EngagementActions from '@/components/ui/EngagementActions';
import {
  FileText,
  Download,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Clock,
  HardDrive,
  User,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Eye,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * PaperCard — displays a single paper with View PDF and Bookmark actions.
 *
 * Props:
 *   paper      — paper object from API
 *   user       — current Supabase user (null for guests)
 *   onAuthOpen — function(trigger) to open AuthModal with context
 */
function PaperCard({ paper, user, onAuthOpen }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const handleView = async () => {
    setError('');
    setLoading(true);
    try {
      // No auth required — guests and logged-in users can both view PDFs
      const res = await fetch(`/api/papers/${paper.id}/signed-url`, {
        credentials: 'include',
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to get PDF link. Please try again.');
        setLoading(false);
        return;
      }

      window.open(json.data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      // Guest: open AuthModal with bookmark context
      onAuthOpen?.('bookmark');
      return;
    }
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await fetch(`/api/bookmarks/${paper.id}`, { method: 'DELETE', credentials: 'include' });
        setBookmarked(false);
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId: paper.id }),
        });
        setBookmarked(true);
      }
    } catch {
      // Silently fail for bookmark actions
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
          <FileText size={24} className="text-emerald-600" strokeWidth={1.5} />
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="font-black text-slate-900 text-base leading-snug mb-1 truncate">
            {paper.title}
          </h3>
          {paper.description && (
            <p className="text-sm text-slate-500 font-medium line-clamp-2">
              {paper.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-semibold">
        <span className="flex items-center gap-1">
          <HardDrive size={12} />
          {formatBytes(paper.size_bytes)}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatDate(paper.created_at)}
        </span>
        {paper.users?.full_name && (
          <span className="flex items-center gap-1">
            <User size={12} />
            {paper.users.full_name}
          </span>
        )}
        <span className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
          PDF
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-slate-50">
        <button
          onClick={handleView}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={13} className="animate-spin" /> Opening…</>
          ) : (
            <><Eye size={13} /> View PDF</>
          )}
        </button>
      </div>
      
      {/* Engagement Actions */}
      <div className="mt-1">
        <EngagementActions resourceId={paper.id} resourceType="paper" />
      </div>
    </div>
  );
}

export default function SubjectNotesPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params?.subjectId;
  const { user, isLoading: authLoading } = useAuth();

  const [authModalTrigger, setAuthModalTrigger] = useState(null);
  const [showAuthFromCard, setShowAuthFromCard] = useState(false);

  const handleCardAuthOpen = (trigger) => {
    setAuthModalTrigger(trigger);
    setShowAuthFromCard(true);
  };

  // ── 1. Fetch Papers (Infinite) ─────────────────────────────
  const {
    data: papersData,
    error: papersError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: papersStatus,
  } = useInfiniteQuery({
    queryKey: ['papers', 'subject', subjectId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/papers?subjectId=${subjectId}&page=${pageParam}&limit=12`,
        { credentials: 'include' }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load papers.');
      return json.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!subjectId,
  });

  const papers = papersData ? papersData.pages.flatMap(p => p.papers ?? []) : [];
  const total = papersData ? papersData.pages[0]?.pagination?.total ?? 0 : 0;
  
  // Try to extract subject from the first paper
  const firstPaperSubject = papersData?.pages[0]?.papers?.[0]?.subjects;

  // ── 2. Fetch Subject Details (Parallel/Fallback) ─────────────
  const { data: fallbackSubjectData, isLoading: subjectLoading } = useQuery({
    queryKey: ['subjectDetails', subjectId],
    queryFn: async () => {
      const res = await fetch(`/api/subjects?subjectId=${subjectId}`, { credentials: 'include' });
      const json = await res.json();
      if (!json.success) throw new Error('Failed to load subject.');
      return json.data;
    },
    // We can fetch in parallel, but if we already know the subject from papers cache, we can skip
    enabled: !!subjectId && !firstPaperSubject,
  });

  const subject = firstPaperSubject || (fallbackSubjectData && fallbackSubjectData.length > 0 ? fallbackSubjectData[0] : null);

  const loading = papersStatus === 'pending' || (subjectLoading && !subject);
  const error = papersError ? papersError.message : '';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Header */}
        <section className="bg-slate-900 pt-16 pb-28 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] -z-0" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] -z-0" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
              <a href="/" className="hover:text-emerald-400 transition-colors">Home</a>
              <ChevronRight size={12} />
              <a href="/branches" className="hover:text-emerald-400 transition-colors">Branches</a>
              {subject && (
                <>
                  <ChevronRight size={12} />
                  <a
                    href={`/branches/${encodeURIComponent(subject.branch)}`}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {subject.branch}
                  </a>
                </>
              )}
              <ChevronRight size={12} />
              <span className="text-slate-300">{subject?.name ?? 'Subject'}</span>
            </nav>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 shrink-0">
                <BookOpen size={30} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                  {loading && !subject ? <Skeleton className="h-10 w-64 md:h-12 md:w-80" /> : subject?.name ?? 'Subject Details'}
                </h1>
                {subject && (
                  <p className="text-slate-400 font-medium text-base">
                    {subject.branch}
                    {subject.semester ? ` · Semester ${subject.semester}` : ''}
                    {subject.code ? ` · ${subject.code}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20 pb-24">
          {/* Stats bar */}
          {!loading && !error && (
            <div className="glass-card px-6 py-4 flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <FileText size={16} className="text-emerald-500" />
                {total} {total === 1 ? 'paper' : 'papers'} available
                {!user && !authLoading && (
                  <span className="ml-3 text-xs font-semibold text-slate-400">
                    · Sign in to bookmark &amp; upload
                  </span>
                )}
              </div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}

          {/* States */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <PaperSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="glass-card p-8 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Something went wrong</h2>
              <p className="text-slate-500 font-medium mb-6">{error}</p>
              <button
                onClick={() => fetchData(page)}
                className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && papers.length === 0 && (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText size={30} className="text-slate-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">No papers yet</h2>
              <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                No PDFs have been uploaded for this subject yet. Be the first to contribute!
              </p>
              {user ? (
                <a
                  href="/upload"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Download size={16} /> Upload a PDF
                </a>
              ) : (
                <button
                  onClick={() => handleCardAuthOpen('upload')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Download size={16} /> Sign in to Upload
                </button>
              )}
            </div>
          )}

          {!loading && !error && papers.length > 0 && (
            <>
              {/* Guest nudge banner — slides in after 600ms, auto-dismissible */}
              {!user && !authLoading && (
                <div className="mb-6">
                  <GuestNudge feature="bookmark" onAuthOpen={handleCardAuthOpen} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    user={user}
                    onAuthOpen={handleCardAuthOpen}
                  />
                ))}
              </div>

              {/* Lazy Load More */}
              {hasNextPage && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-8 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2"
                  >
                    {isFetchingNextPage ? (
                      <><Loader2 size={16} className="animate-spin" /> Loading…</>
                    ) : (
                      'Load More Papers'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />

      {/* Auth modal triggered from PaperCard bookmark/upload actions */}
      {showAuthFromCard && (
        <AuthModal
          onClose={() => { setShowAuthFromCard(false); setAuthModalTrigger(null); }}
          trigger={authModalTrigger}
        />
      )}
    </div>
  );
}
