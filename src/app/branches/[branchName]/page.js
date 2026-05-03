'use client';
import { useState, useEffect } from 'react';
import { branchData } from '@/data/branches';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  ChevronRight,
  Search,
  Download,
  ExternalLink,
  BookOpen,
  Filter,
  Eye,
  Upload,
  Loader2
} from 'lucide-react';

export default function BranchPage({ params }) {
  const branchName = decodeURIComponent(params.branchName);

  // Normalize branch name to match branchData keys
  const getBranchKey = (name) => {
    // 1. Direct match
    if (branchData[name]) return name;

    // 2. Formal mapping (from database labels or variants)
    const mapping = {
      'B.E. Chemical Engineering (CE)': 'Chemical Engineering',
      'B.E. Civil Engineering (CE)': 'Civil Engineering',
      'B.E. Electrical Engineering (EE)': 'Electrical Engineering',
      'B.E. Electronics and Electrical Engineering (EEE)': 'Electronics & Electrical Engineering',
      'B.E. Mechanical Engineering (ME)': 'Mechanical Engineering (ME)',
      'B.E. Petroleum Engineering (PE)': 'Petroleum Engineering',
      'B.E. Production and Industrial Engineering (P&I)': 'Production & Industrial Engineering',
      'B.E. Building and Construction Technology (BCT)': 'Building & Construction Technology',
      'B.E. Information Technology (IT)': 'Information Technology',
      'B.E. Computer Science and Engineering (CSE)': 'Computer Science Engineering (CSE)',
      'B.E. Artificial Intelligence and Data Science (AI&DS)': 'Artificial Intelligence & Data Science (ADS)',
      'B.E. Electronics and Communication Engineering (ECE)': 'Electronics & Communication Engineering (ECE)',
      'B.E. Electronics and Computer Engineering (ECC)': 'Electronics & Computer Engineering (ECC)',
      'B.E. Mining Engineering (MI)': 'Mining Engineering',
      'Bachelor of Architecture (B.Arch)': 'Bachelor of Architecture (B.Arch)',
      'Civil Semester': 'Civil Engineering (CE)',
      'Mechanical Semester': 'Mechanical Engineering (ME)',
      // Partial/Variant matches
      'Artificial Intelligence and Data Science (AI&DS)': 'Artificial Intelligence & Data Science (ADS)',
      'AI&DS': 'Artificial Intelligence & Data Science (ADS)',
      'CSE': 'Computer Science Engineering (CSE)',
      'ECE': 'Electronics & Communication Engineering (ECE)',
      'IT': 'Information Technology',
    };

    if (mapping[name]) return mapping[name];

    // 3. Try stripping "B.E. " prefix
    const stripped = name.replace(/^B\.E\.\s+\((.*)\)$/, '$1').replace(/^B\.E\.\s+/, '');
    if (branchData[stripped]) return stripped;
    if (mapping[stripped]) return mapping[stripped];

    return name;
  };

  const dataKey = getBranchKey(branchName);
  const data = branchData[dataKey];

  // Database ID mapping state
  const [subjectMappings, setSubjectMappings] = useState({});
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    async function resolveAllSubjects() {
      setDbLoading(true);
      const supabase = createClient();
      const newMappings = {};

      try {
        // Collect all subjects across all semesters for this branch
        const allSubjects = [];
        semesters.forEach(sem => {
          data[sem].forEach(subject => {
            allSubjects.push({ sem, ...subject });
          });
        });

        // Resolve each subject (using the API to ensure upsert happens if needed)
        // We do this in parallel for speed
        await Promise.all(allSubjects.map(async (subj) => {
          try {
            const res = await fetch('/api/subjects/resolve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                branch: dataKey,
                semester: parseInt(subj.sem),
                name: subj.name,
                code: subj.code
              })
            });
            const result = await res.json();
            if (result.success && result.data?.id) {
              newMappings[`${subj.sem}-${subj.name}`] = result.data.id;
            }
          } catch (err) {
            console.error(`Failed to resolve subject ${subj.name}:`, err);
          }
        }));

        setSubjectMappings(newMappings);
      } catch (err) {
        console.error('Error in batch resolution:', err);
      } finally {
        setDbLoading(false);
      }
    }

    if (data && branchName) {
      resolveAllSubjects();
    }
  }, [dataKey, branchName, data]);

  const getDbId = (sem, name) => subjectMappings[`${sem}-${name}`];
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>Branch Not Found</h1>
          <p className="mb-8 font-medium" style={{ color: 'var(--text-secondary)' }}>The branch you are looking for does not exist in our database.</p>
          <a href="/" className="btn-premium-primary">Back to Home</a>
        </main>
        <Footer />
      </div>
    );
  }

  const semesters = Object.keys(data).sort((a, b) => a - b);


  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <main className="flex-grow">
        {/* Branch Header */}
        <section className="bg-slate-900 pt-16 pb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] -z-0" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -z-0" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <BookOpen size={32} />
              </div>
              <div>
                <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  <a href="/" className="hover:text-emerald-400">Home</a>
                  <ChevronRight size={12} />
                  <span className="text-slate-300">{branchName}</span>
                </nav>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                  {branchName}
                </h1>
              </div>
            </div>

            <p className="max-w-3xl text-lg text-slate-400 font-medium leading-relaxed">
              Comprehensive study repository including verified lecture notes,
              previous year question banks, and essential revision summaries
              curated for {branchName} students.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-12 relative z-20">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar Navigation */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="glass-card p-6 sticky top-28">
                <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Filter size={14} className="text-emerald-500" /> Jump to Semester
                </h2>
                <div className="space-y-2">
                  {semesters.map((sem) => (
                    <a
                      key={sem}
                      href={`#sem-${sem}`}
                      className="flex items-center justify-between p-3 rounded-xl text-sm font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 transition-all group"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Semester {sem}
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            </aside>

            {/* Subjects Grid */}
            <div className="flex-grow space-y-20">
              {semesters.map((sem) => (
                <div key={sem} id={`sem-${sem}`} className="scroll-mt-28">
                  <div className="flex items-center justify-between mb-8 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: 'var(--text)' }}>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ backgroundColor: 'var(--text)' }}>
                        {sem}
                      </span>
                      Semester {sem}
                    </h2>
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                      {data[sem].length} Courses Available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data[sem].map((subject, idx) => {
                      const dbId = getDbId(sem, subject.name);

                      // ✅ FIX: Always prefer the DB UUID (dbId) — it uniquely identifies
                      // exactly one subject. Subject codes are display labels, NOT unique
                      // identifiers, and using them as route params caused wrong subjects
                      // to be loaded (e.g. "HTO-2" resolving to a different subject).
                      const viewNotesUrl = dbId
                        ? `/subjects/${dbId}`
                        : subject.code && subject.code !== '—'
                          ? `/subjects/${encodeURIComponent(subject.code)}`
                          : `/subjects/search?branch=${encodeURIComponent(dataKey)}&semester=${sem}&name=${encodeURIComponent(subject.name)}`;

                      // Debug log for production tracing
                      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
                        console.log(
                          `[SubjectCard] sem=${sem} name=${subject.name} code=${subject.code} dbId=${dbId} → ${viewNotesUrl}`
                        );
                      }

                      const uploadUrl = `/upload?branch=${encodeURIComponent(dataKey)}&semester=${sem}&subject=${encodeURIComponent(subject.name)}`;

                      return (
                        <div key={idx} className="glass-card p-6 hover-lift flex flex-col">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>
                              <FileText size={24} strokeWidth={1.5} />
                            </div>
                            <div className="flex items-center gap-2">
                              {dbId && !dbLoading && (
                                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-black uppercase tracking-wider">
                                  PDFs Available
                                </span>
                              )}
                              <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>
                                {subject.code || 'CODE'}
                              </span>
                            </div>
                          </div>

                          <a href={viewNotesUrl} className="group/title block mb-2">
                            <h3 className="text-lg font-black leading-snug group-hover/title:text-emerald-600 transition-colors" style={{ color: 'var(--text)' }}>
                              {subject.name}
                            </h3>
                          </a>

                          <p className="text-sm font-medium mb-6 flex-grow" style={{ color: 'var(--muted)' }}>
                            Access verified lecture materials and past papers for better preparation.
                          </p>

                          <div className="flex flex-col gap-2">
                            {/* View Notes — always present */}
                            <a
                              href={viewNotesUrl}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${dbId
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <Eye size={14} />
                                View Notes
                              </span>
                              {dbId && !dbLoading && (
                                <span className="bg-white/20 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  PDFs ✓
                                </span>
                              )}
                            </a>

                            {/* Upload Notes */}
                            <button
                              disabled={dbLoading}
                              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-60"
                              style={{ backgroundColor: 'var(--text)' }}
                              onClick={() => { window.location.href = uploadUrl; }}
                            >
                              {dbLoading ? (
                                <><Loader2 size={12} className="animate-spin" /> Loading…</>
                              ) : (
                                <>Upload Notes <Upload size={14} /></>
                              )}
                            </button>

                            {/* PYQs & Prep */}
                            <a
                              href={viewNotesUrl}
                              className="flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-bold transition-all hover:border-emerald-400 hover:text-emerald-600"
                              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                            >
                              PYQs &amp; Prep <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
