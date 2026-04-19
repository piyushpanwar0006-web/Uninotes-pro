'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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

function PaperCard({ paper }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleView = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/papers/${paper.id}/signed-url`, {
        credentials: 'include',
      });
      const json = await res.json();

      if (!json.success) {
        if (res.status === 401) {
          setError('Sign in to view this paper.');
        } else {
          setError(json.error || 'Failed to get PDF link.');
        }
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
    </div>
  );
}

export default function SubjectNotesPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params?.subjectId;

  const [subject, setSubject] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async (pg = 1) => {
    if (!subjectId) return;
    setLoading(true);
    setError('');

    try {
      // Fetch papers for this subject
      const papersRes = await fetch(
        `/api/papers?subjectId=${subjectId}&page=${pg}&limit=12`,
        { credentials: 'include' }
      );
      const papersJson = await papersRes.json();

      if (!papersJson.success) {
        setError(papersJson.error || 'Failed to load papers.');
        setLoading(false);
        return;
      }

      const { papers: p, pagination } = papersJson.data;
      setPapers(p ?? []);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotal(pagination?.total ?? 0);

      // Extract subject info from the first paper if available
      if (p && p.length > 0 && p[0].subjects) {
        setSubject(p[0].subjects);
      } else if (!subject) {
        // Fallback: fetch subject info directly
        try {
          const subjRes = await fetch(`/api/subjects?subjectId=${subjectId}`, {
            credentials: 'include',
          });
          const subjJson = await subjRes.json();
          if (subjJson.success && subjJson.data?.length > 0) {
            setSubject(subjJson.data[0]);
          } else {
            setSubject({ name: 'Subject Not Found', branch: 'Unknown' });
          }
        } catch (err) {
          console.error("Failed to fetch subject details", err);
          setSubject({ name: 'Subject', branch: 'Unknown' });
        }
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  const handlePage = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
                  {subject?.name ?? 'Loading…'}
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
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-400">
              <Loader2 size={36} className="animate-spin text-emerald-500" />
              <p className="font-bold text-sm">Loading papers…</p>
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
              <a
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Download size={16} /> Upload a PDF
              </a>
            </div>
          )}

          {!loading && !error && papers.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => handlePage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-bold text-slate-500 px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePage(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
