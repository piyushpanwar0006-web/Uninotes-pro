'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  FileText,
  ChevronRight,
  BookOpen,
  AlertCircle,
  Loader2,
  Upload,
  ArrowLeft,
  Eye,
  Clock,
  HardDrive,
  User,
} from 'lucide-react';

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
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PaperCard({ paper }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleView = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/papers/${paper.id}/signed-url`, { credentials: 'include' });
      const json = await res.json();
      if (!json.success) {
        setError(res.status === 401 ? 'Sign in to view this PDF.' : json.error || 'Failed to get PDF link.');
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col gap-4 group">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
          <FileText size={22} className="text-emerald-600" strokeWidth={1.5} />
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="font-black text-slate-900 text-[15px] leading-snug mb-1 line-clamp-2">{paper.title}</h3>
          {paper.description && (
            <p className="text-xs text-slate-500 font-medium line-clamp-2">{paper.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-semibold">
        <span className="flex items-center gap-1"><Clock size={11} />{formatDate(paper.created_at)}</span>
        <span className="flex items-center gap-1"><HardDrive size={11} />{formatBytes(paper.size_bytes)}</span>
        {paper.users?.full_name && (
          <span className="flex items-center gap-1"><User size={11} />{paper.users.full_name}</span>
        )}
        <span className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">PDF</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <AlertCircle size={12} className="shrink-0" />{error}
        </div>
      )}

      <button
        onClick={handleView}
        disabled={loading}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-auto"
      >
        {loading ? <><Loader2 size={12} className="animate-spin" /> Opening…</> : <><Eye size={12} /> View PDF</>}
      </button>
    </div>
  );
}

export default function SubjectSearchPage() {
  const searchParams = useSearchParams();
  const branch = searchParams.get('branch') || '';
  const semester = searchParams.get('semester') || '';
  const name = searchParams.get('name') || '';

  const [subject, setSubject] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const uploadUrl = `/upload?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&subject=${encodeURIComponent(name)}`;

  const fetchData = useCallback(async () => {
    if (!name) { setLoading(false); return; }
    setLoading(true);
    setError('');

    try {
      const papersParams = new URLSearchParams();
      if (branch) papersParams.set('branch', branch);
      if (semester) papersParams.set('semester', semester);
      if (name) papersParams.set('subject', name);
      papersParams.set('page', '1');
      papersParams.set('limit', '20');

      const papersRes = await fetch(`/api/papers?${papersParams}`, { credentials: 'include' });
      const papersJson = await papersRes.json();

      if (papersJson.success) {
        const p = papersJson.data.papers ?? [];
        setPapers(p);
        setTotal(papersJson.data.pagination?.total ?? 0);

        if (p.length > 0 && p[0].subjects) {
          setSubject(p[0].subjects);
        } else {
          // Fallback to fetch subject details if papers list is empty
          try {
            const subjParams = new URLSearchParams();
            if (branch) subjParams.set('branch', branch);
            if (semester) subjParams.set('semester', semester);
            if (name) subjParams.set('name', name);
            
            const subjRes = await fetch(`/api/subjects?${subjParams}`, { credentials: 'include' });
            const subjJson = await subjRes.json();
            
            if (subjJson.success && subjJson.data && subjJson.data.length > 0) {
              setSubject(subjJson.data[0]);
            } else {
               setSubject(null);
            }
          } catch (err) {
            console.error("Failed to fetch subject details", err);
            setSubject(null);
          }
        }
      } else {
        setError(papersJson.error || 'Failed to fetch notes.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [branch, semester, name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="bg-slate-900 pt-16 pb-28 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] -z-0" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] -z-0" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 flex-wrap">
              <a href="/" className="hover:text-emerald-400 transition-colors">Home</a>
              <ChevronRight size={12} />
              <a href="/branches" className="hover:text-emerald-400 transition-colors">Branches</a>
              {branch && (
                <>
                  <ChevronRight size={12} />
                  <a href={`/branches/${encodeURIComponent(branch)}`} className="hover:text-emerald-400 transition-colors">
                    {branch}
                  </a>
                </>
              )}
              <ChevronRight size={12} />
              <span className="text-slate-300">{name || 'Subject'}</span>
            </nav>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 shrink-0">
                <BookOpen size={30} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-1">
                  {name || 'Subject Notes'}
                </h1>
                {(branch || semester) && (
                  <p className="text-slate-400 font-medium text-base">
                    {branch}{semester ? ` · Semester ${semester}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20 pb-24">

          {/* Stats + back */}
          {!loading && !error && (
            <div className="glass-card px-6 py-4 flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <FileText size={16} className="text-emerald-500" />
                {total} {total === 1 ? 'note' : 'notes'} for this subject
              </div>
              <a
                href={branch ? `/branches/${encodeURIComponent(branch)}` : '/branches'}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Branch
              </a>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-400">
              <Loader2 size={36} className="animate-spin text-emerald-500" />
              <p className="font-bold text-sm">Loading notes…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="glass-card p-8 text-center">
              <AlertCircle size={32} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-black text-slate-900 mb-2">Something went wrong</h2>
              <p className="text-slate-500 mb-6">{error}</p>
              <button onClick={fetchData} className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800">
                Try Again
              </button>
            </div>
          )}

          {/* Empty state — no subject or no papers */}
          {!loading && !error && papers.length === 0 && (
            <div className="glass-card p-14 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText size={30} className="text-slate-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">No notes yet for this subject</h2>
              <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
                No PDFs have been uploaded for <span className="font-bold text-slate-700">{name}</span>{' '}
                {semester ? `(Semester ${semester})` : ''} yet. Be the first to contribute!
              </p>
              <a
                href={uploadUrl}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Upload size={15} /> Upload Notes for this Subject
              </a>
            </div>
          )}

          {/* Papers grid */}
          {!loading && !error && papers.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>

              {/* Upload more CTA */}
              <div className="mt-12 glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-black text-slate-900 text-sm">Have more notes for {name}?</p>
                  <p className="text-slate-500 text-xs font-medium">Help the community grow by uploading more PDFs.</p>
                </div>
                <a
                  href={uploadUrl}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all shrink-0"
                >
                  <Upload size={13} /> Upload More
                </a>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
