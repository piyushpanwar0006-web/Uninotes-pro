'use client';
<<<<<<< HEAD

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, FileText, Download, Clock, BookOpen, User, AlertCircle, Loader2 } from 'lucide-react';

export default function NotesPage() {
  const [papers, setPapers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/papers?limit=50');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to fetch notes.');
      }

      setPapers(json.data.papers || []);
    } catch (err) {
      console.error('Error fetching papers:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessNote = async (paperId) => {
    try {
      setDownloadingId(paperId);
      const res = await fetch(`/api/papers/${paperId}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to access note.');
      }

      const { signedUrl } = json.data;
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        alert('Document URL is missing.');
      }
    } catch (err) {
      console.error('Error opening note:', err);
      alert(err.message || 'Failed to open note.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredPapers = papers.filter((paper) => {
    if (!searchQuery.trim()) return true;
    const lowerQ = searchQuery.toLowerCase();
    const titleMatch = paper.title.toLowerCase().includes(lowerQ);
    const descMatch = paper.description?.toLowerCase().includes(lowerQ);
    const subjectMatch = paper.subjects?.name?.toLowerCase().includes(lowerQ);
    const branchMatch = paper.subjects?.branch?.toLowerCase().includes(lowerQ);
    
    return titleMatch || descMatch || subjectMatch || branchMatch;
  });

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };
=======
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  FileText,
  Clock,
  HardDrive,
  User,
  BookOpen,
  AlertCircle,
  Loader2,
  Eye,
  Upload,
  Search,
  X,
  ChevronRight,
  BookMarked,
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000; // seconds
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PaperCard({ paper }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subject = paper.subjects;
  const uploader = paper.users;

  const handleView = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/papers/${paper.id}/signed-url`, {
        credentials: 'include',
      });
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
      {/* Header row */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
          <FileText size={22} className="text-emerald-600" strokeWidth={1.5} />
        </div>
        <div className="flex-grow min-w-0">
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
          <span className="text-[11px] font-black text-slate-600 tracking-wide">
            {subject.name}
          </span>
          {subject.semester && (
            <span className="text-[10px] text-slate-400 font-bold">· Sem {subject.semester}</span>
          )}
        </a>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-semibold">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {formatDate(paper.created_at)}
        </span>
        <span className="flex items-center gap-1">
          <HardDrive size={11} />
          {formatBytes(paper.size_bytes)}
        </span>
        {uploader?.full_name && (
          <span className="flex items-center gap-1">
            <User size={11} />
            {uploader.full_name}
          </span>
        )}
        <span className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
          PDF
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Action */}
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

export default function NotesPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const LIMIT = 12;

  const fetchPapers = useCallback(async (pg = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/papers?page=${pg}&limit=${LIMIT}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to load notes.');
        setLoading(false);
        return;
      }
      setPapers(json.data.papers ?? []);
      setTotalPages(json.data.pagination?.totalPages ?? 1);
      setTotal(json.data.pagination?.total ?? 0);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPapers(page);
  }, [fetchPapers, page]);

  const handlePage = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Client-side search filter
  const filtered = search.trim()
    ? papers.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.subjects?.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.subjects?.branch?.toLowerCase().includes(search.toLowerCase())
      )
    : papers;
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-grow">
<<<<<<< HEAD
        {/* Header Section */}
        <section className="bg-slate-900 pt-16 pb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] -z-0" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -z-0" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 animate-fade-in">
              Global <span className="text-emerald-500">Study Notes</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-400 font-medium leading-relaxed mb-10 animate-fade-in stagger-1">
              Browse, search, and download all verified PDFs, assignments, and study materials uploaded by students.
            </p>

            {/* Global Search Bar */}
            <div className="max-w-2xl mx-auto relative group animate-fade-in stagger-2">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex items-center bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
                <Search className="ml-4 text-emerald-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes by title, subject, or branch..." 
                  className="flex-grow px-4 py-3 outline-none text-white font-medium placeholder:text-slate-400 bg-transparent"
                />
              </div>
=======
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
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183
            </div>
          </div>
        </section>

<<<<<<< HEAD
        {/* Notes Grid Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-12 relative z-20">
          <div className="glass-card p-6 md:p-8 min-h-[400px]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                Latest Uploads
              </h2>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:inline-block">
                {isLoading ? 'Loading...' : `${filteredPapers.length} Notes Found`}
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                <p className="font-medium">Fetching the latest study notes...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 text-red-500 bg-red-50 rounded-2xl">
                <AlertCircle className="w-10 h-10 mb-4" />
                <p className="font-medium text-center">{error}</p>
                <button 
                  onClick={fetchPapers}
                  className="mt-4 px-4 py-2 bg-red-100 font-bold rounded-lg text-red-600 hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredPapers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPapers.map((paper) => (
                  <div key={paper.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                        <FileText size={20} strokeWidth={2} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase tracking-wider">
                          {formatBytes(paper.size_bytes)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                          <Clock size={10} /> {formatDate(paper.created_at)}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 mb-2 line-clamp-2">
                      {paper.title}
                    </h3>
                    
                    {paper.description && (
                      <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2 flex-grow">
                        {paper.description}
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-50 space-y-3">
                      {paper.subjects && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-lg">
                          <BookOpen size={14} className="text-emerald-500 shrink-0" />
                          <span className="truncate">{paper.subjects.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <User size={14} />
                          <span className="truncate max-w-[100px]">{paper.users?.full_name || 'Anonymous'}</span>
                        </div>
                        
                        <button 
                          onClick={() => handleAccessNote(paper.id)}
                          disabled={downloadingId === paper.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadingId === paper.id ? (
                            <><Loader2 size={14} className="animate-spin" /> Preparing...</>
                          ) : (
                            <>View <Download size={14} /></>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-xl font-black text-slate-900 mb-2">No Notes Found</h3>
                <p className="font-medium text-center max-w-sm">
                  {searchQuery 
                    ? `We couldn't find any notes matching "${searchQuery}". Try different keywords.`
                    : "There are no notes uploaded yet. Be the first to upload one!"}
                </p>
              </div>
            )}
          </div>
=======
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20 pb-24">
          {/* Stats + Search bar */}
          <div className="glass-card px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
            {!loading && !error && (
              <p className="text-sm font-bold text-slate-600 shrink-0">
                {total} {total === 1 ? 'note' : 'notes'} available
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
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-400">
              <Loader2 size={36} className="animate-spin text-emerald-500" />
              <p className="font-bold text-sm">Loading notes…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="glass-card p-10 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Something went wrong</h2>
              <p className="text-slate-500 font-medium mb-6">{error}</p>
              <button
                onClick={() => fetchPapers(page)}
                className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <div className="glass-card p-14 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText size={30} className="text-slate-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">
                {search ? 'No results found' : 'No notes uploaded yet'}
              </h2>
              <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                {search
                  ? `No notes matched "${search}". Try a different search term.`
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

          {/* Grid */}
          {!loading && !error && filtered.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>

              {/* Pagination — only show when not filtering client-side */}
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
>>>>>>> a63fb2346cc2fdd196bd0a2af0c2ec4911af1183
        </section>
      </main>

      <Footer />
    </div>
  );
}
