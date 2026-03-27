'use client';

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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-grow">
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
            </div>
          </div>
        </section>

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
        </section>
      </main>

      <Footer />
    </div>
  );
}
