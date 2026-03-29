import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  BookOpen, 
  FileText, 
  User, 
  Calendar, 
  Download, 
  Star, 
  ChevronRight,
  ArrowLeft,
  Filter,
  Search,
  Upload,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getSubjectData(supabase, subjectCode) {
  // Try UUID first if it matches UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectCode);
  
  if (isUUID) {
    const { data: idData, error: idError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectCode)
      .single();
    if (idData) return { data: idData, error: idError };
  }

  // Fallback or primary: Search by code
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('code', subjectCode)
    .single();
  
  return { data, error };
}

async function getNotes(supabase, subjectCode, sortBy = 'latest', limit = 10) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectCode);

  let query = supabase
    .from('notes')
    .select(`
      *,
      users ( full_name, avatar_url )
    `)
    .eq('status', 'ready');

  if (isUUID) {
    query = query.eq('subject_id', subjectCode);
  } else {
    query = query.eq('subject_code', subjectCode);
  }

  if (sortBy === 'latest') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('downloads', { ascending: false });
  }

  const { data, error } = await query.limit(limit);
  return { data, error };
}

export default async function SubjectNotesPage({ params, searchParams }) {
  const subjectCode = params.subjectCode;
  const sortBy = searchParams.sortBy || 'latest';
  const supabase = await createClient();

  const { data: subject, error: subjectError } = await getSubjectData(supabase, subjectCode);
  const { data: notes, error: notesError } = await getNotes(supabase, subjectCode, sortBy);

  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mb-6">
            <BookOpen size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Subject Not Found</h1>
          <p className="text-slate-500 mb-8 font-medium text-center max-w-md">
            We couldn't find any resources for the code <span className="text-slate-900 font-bold">"{subjectCode}"</span>. 
            It might be a new course or an incorrect code.
          </p>
          <Link href="/" className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
            Back to Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-grow">
        {/* Subject Header */}
        <section className="bg-slate-900 pt-20 pb-32 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Link 
              href={`/branches/${encodeURIComponent(subject.branch)}`}
              className="inline-flex items-center gap-2 text-emerald-400 text-sm font-bold mb-8 hover:text-emerald-300 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to {subject.branch}
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  Verified Repository
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]">
                  {subject.name}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white text-xs">
                      {subject.semester}
                    </span>
                    Semester {subject.semester}
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-white/5 text-white text-xs font-black tracking-widest leading-none">
                      {subject.code}
                    </span>
                    Course Code
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link 
                  href={`/upload?subject=${encodeURIComponent(subject.name)}&branch=${encodeURIComponent(subject.branch)}&semester=${subject.semester}`}
                  className="px-6 py-3.5 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Upload size={18} />
                  Contribute Notes
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Notes Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-16 relative z-20">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Filters Sidebar */}
            <aside className="lg:w-72 shrink-0">
              <div className="glass-card p-6 sticky top-28 space-y-8">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Filter size={14} className="text-emerald-500" /> Sort By
                  </h3>
                  <div className="space-y-2">
                    {[
                      { id: 'latest', label: 'Recently Added', icon: Calendar },
                      { id: 'popularity', label: 'Most Downloaded', icon: Star }
                    ].map((opt) => (
                      <Link
                        key={opt.id}
                        href={`?sortBy=${opt.id}`}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${
                          sortBy === opt.id 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <opt.icon size={16} />
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <BookOpen size={60} />
                    </div>
                    <h4 className="text-white font-bold mb-2 relative z-10">Study Groups</h4>
                    <p className="text-slate-400 text-xs mb-4 relative z-10 leading-relaxed">
                      Join the discussion with other students studying {subject.name}.
                    </p>
                    <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-lg transition-colors relative z-10">
                      Join Community
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Notes List */}
            <div className="flex-grow">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900">
                  Resources <span className="text-slate-400 font-medium ml-2">({notes?.length || 0})</span>
                </h2>
                <div className="relative group">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search in notes..." 
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-48 md:w-64"
                  />
                </div>
              </div>

              {notes && notes.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {notes.map((note) => (
                    <div 
                      key={note.id} 
                      className="glass-card hover-lift p-5 flex flex-col md:flex-row md:items-center gap-6 border-slate-100 group"
                    >
                      <div className="w-14 h-14 shrink-0 bg-slate-50 group-hover:bg-emerald-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-all">
                        <FileText size={28} />
                      </div>

                      <div className="flex-grow space-y-1">
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                          {note.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-slate-300" />
                            {note.users?.full_name || 'Anonymous'}
                          </div>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-300" />
                            {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center text-amber-500">
                              <Star size={12} fill="currentColor" />
                              <span className="ml-1 text-slate-900">4.5</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                        <div className="text-center hidden sm:block">
                          <div className="text-slate-900 font-black text-base">{note.downloads}</div>
                          <div className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Downloads</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link
                            href={note.storage_path}  // In production, this would be a redirect or signed URL
                            target="_blank"
                            className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10 group-hover:scale-105"
                          >
                            <Download size={20} />
                          </Link>
                          <button className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
                            <ExternalLink size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                    <FileText size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No notes available yet</h3>
                  <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                    Be the first one to contribute notes for this subject and help thousands of other students.
                  </p>
                  <Link 
                    href={`/upload?subject=${encodeURIComponent(subject.name)}&branch=${encodeURIComponent(subject.branch)}&semester=${subject.semester}`}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                  >
                    <Upload size={18} />
                    Upload Now
                  </Link>
                </div>
              )}

              {/* Pagination (Placeholders for now) */}
              {notes && notes.length > 5 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-400 cursor-not-allowed">Previous</button>
                  <button className="w-10 h-10 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20">1</button>
                  <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 hover:bg-slate-50">Next</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Feature Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32 blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Need PYQs for {subject.name}?</h2>
                <p className="text-blue-100 text-lg font-medium max-w-xl">
                  We have a dedicated section for Previous Year Question papers to help you master the exam pattern.
                </p>
              </div>
              <Link 
                href={`/papers?subject=${encodeURIComponent(subject.name)}`}
                className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-2xl flex items-center gap-2 shrink-0"
              >
                View PYQs 
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
