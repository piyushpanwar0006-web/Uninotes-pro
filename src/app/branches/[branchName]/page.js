'use client';
import { branchData } from '@/data/branches';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  FileText,
  ChevronRight,
  Search,
  Download,
  ExternalLink,
  BookOpen,
  Filter
} from 'lucide-react';

export default function BranchPage({ params }) {
  const branchName = decodeURIComponent(params.branchName);

  // Normalize branch name to match branchData keys
  const getBranchKey = (name) => {
    if (branchData[name]) return name;

    // Mapping from table names to data keys
    const mapping = {
      'B.E. (Chemical Engineering (CE))': 'Chemical Engineering',
      'B.E. (Civil Engineering (CE))': 'Civil Engineering',
      'B.E. (Electrical Engineering (EE))': 'Electrical Engineering',
      'B.E. (Electronics and Electrical Engineering (EEE))': 'Electronics & Electrical Engineering',
      'B.E. (Mechanical Engineering (ME))': 'Mechanical Engineering (ME)',
      'B.E. (Petroleum Engineering (PE))': 'Petroleum Engineering',
      'B.E. (Production and Industrial Engineering (P&I))': 'Production & Industrial Engineering',
      'B.E. (Building and Construction Technology (BCT))': 'Building & Construction Technology',
      'B.E. (Information Technology (IT))': 'Information Technology',
      'B.E. (Computer Science and Engineering (CSE))': 'Computer Science Engineering (CSE)',
      'B.E. (Artificial Intelligence and Data Science (AI&DS))': 'Artificial Intelligence & Data Science (ADS)',
      'B.E. (Electronics and Communication Engineering (ECE))': 'Electronics & Communication Engineering (ECE)',
      'B.E. (Electronics and Computer Engineering (ECC))': 'Electronics & Computer Engineering (ECC)',
      'B.E. (Mining Engineering (MI))': 'Mining Engineering',
      'Bachelor of Architecture (B.Arch)': 'Bachelor of Architecture (B.Arch)',
      'Civil Semester': 'Civil Engineering (CE)',
      'Mechanical Semester': 'Mechanical Engineering (ME)',
    };

    return mapping[name] || name;
  };

  const dataKey = getBranchKey(branchName);
  const data = branchData[dataKey];

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-black text-slate-900 mb-4">Branch Not Found</h1>
          <p className="text-slate-500 mb-8 font-medium">The branch you are looking for does not exist in our database.</p>
          <a href="/" className="btn-premium-primary">Back to Home</a>
        </main>
        <Footer />
      </div>
    );
  }

  const semesters = Object.keys(data).sort((a, b) => a - b);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-grow">
        {/* Branch Header */}
        <section className="bg-slate-900 pt-16 pb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] -z-0" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -z-0" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                {BookOpen && <BookOpen size={32} />}
              </div>
              <div>
                <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  <a href="/" className="hover:text-emerald-400">Home</a>
                  {ChevronRight && <ChevronRight size={12} />}
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
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  {Filter && <Filter size={14} className="text-emerald-500" />} Jump to Semester
                </h2>
                <div className="space-y-2">
                  {semesters.map((sem) => (
                    <a
                      key={sem}
                      href={`#sem-${sem}`}
                      className="flex items-center justify-between p-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all group"
                    >
                      Semester {sem}
                      {ChevronRight && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </a>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="p-4 bg-slate-900 rounded-2xl">
                    <div className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">Status</div>
                    <div className="text-white text-sm font-bold mb-3">{branchName}</div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-[85%] h-full bg-emerald-500" />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 font-bold uppercase">85% Resources Verified</div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Subjects Grid */}
            <div className="flex-grow space-y-20">
              {semesters.map((sem) => (
                <div key={sem} id={`#sem-${sem}`} className="scroll-mt-28">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">
                        {sem}
                      </span>
                      Semester {sem}
                    </h2>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {data[sem].length} Courses Available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data[sem].map((subject, idx) => (
                      <div key={idx} className="glass-card p-6 hover-lift border-slate-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                            {FileText && <FileText size={24} strokeWidth={1.5} />}
                          </div>
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase tracking-wider">
                            {subject.code || 'CODE'}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 mb-2 truncate">
                          {subject.name}
                        </h3>

                        <p className="text-sm text-slate-400 font-medium mb-6">
                          Access verified lecture materials for better preparation.
                        </p>

                        <div className="flex flex-col gap-2">
                          <button className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all">
                            Access Notes {Download && <Download size={14} />}
                          </button>
                          <button className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold hover:bg-slate-50 transition-all">
                            PYQs & Prep {ExternalLink && <ExternalLink size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
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
