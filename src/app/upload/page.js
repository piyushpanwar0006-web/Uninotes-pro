'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2, BookOpen } from 'lucide-react';

// Branch + semester options matching branchData
const BRANCHES = [
  'Civil Semester',
  'Mechanical semester',
  'Chemical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Electronics & Electrical Engineering',
  'Mechanical Engineering (ME)',
  'Petroleum Engineering',
  'Production & Industrial Engineering',
  'Building & Construction Technology',
  'Information Technology',
  'Computer Science Engineering (CSE)',
  'Artificial Intelligence & Data Science (ADS)',
  'Electronics & Communication Engineering (ECE)',
  'Electronics & Computer Engineering (ECC)',
  'Mining Engineering',
  'Bachelor of Architecture (B.Arch)',
];

const SEMESTERS = [3, 4, 5, 6, 7, 8];
const MAX_MB = 25;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const isSemesterOptional = (branch) => {
  if (!branch) return false;
  const lower = branch.toLowerCase();
  return lower.includes('civil semester') || lower.includes('mechanical semester');
};

export default function UploadPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-slate-400">Loading…</div></div>}>
      <UploadPage />
    </Suspense>
  );
}

function UploadPage() {
  const fileRef = useRef(null);
  const searchParams = useSearchParams();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({
    branch: '',
    semester: '',
    subjectName: '',
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null); // { paperId, signedUrl }

  // Pre-fill form if URL params are provided (e.g. from branch page)
  useEffect(() => {
    const branch = searchParams.get('branch') || '';
    const semester = searchParams.get('semester') || '';
    const subject = searchParams.get('subject') || '';
    if (branch || semester || subject) {
      setForm((f) => ({
        ...f,
        branch: branch || f.branch,
        semester: semester || f.semester,
        subjectName: subject || f.subjectName,
      }));
    }
  }, [searchParams]);
  const handleFile = (f) => {
    setError('');
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`File size exceeds ${MAX_MB}MB limit. Your file is ${(f.size / 1024 / 1024).toFixed(1)}MB.`);
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) return setError('Please select a PDF file.');
    const semOptional = isSemesterOptional(form.branch);
    if (!form.branch) return setError('Please select a branch.');
    if (!semOptional && !form.semester) return setError('Please select a semester.');

    if (!form.title.trim()) return setError('Please enter a title.');

    setLoading(true);

    try {
      // Step 1: Resolve or create the subject, get its ID
      // Since subjects need a UUID from the DB, we call a helper endpoint
      const subjectRes = await fetch('/api/subjects/resolve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: form.branch,
          semester: semOptional ? (form.semester ? Number(form.semester) : 1) : Number(form.semester),
          name: form.subjectName || form.title,
        }),
      });
      const subjectJson = await subjectRes.json();

      if (!subjectJson.success) {
        setError(subjectJson.error || 'Failed to resolve subject. Are you logged in?');
        setLoading(false);
        return;
      }

      const subjectId = subjectJson.data.id;

      // Step 2: Upload the PDF
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', subjectId);
      formData.append('title', form.title);
      if (form.description) formData.append('description', form.description);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadJson.success) {
        if (uploadRes.status === 401) {
          setError('You must be signed in to upload. Click "Sign In" in the navbar.');
        } else {
          setError(uploadJson.error || 'Upload failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      setSuccess(uploadJson.data);
      setFile(null);
      setForm({ branch: '', semester: '', subjectName: '', title: '', description: '' });
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-grow">
        {/* Header */}
        <section className="bg-slate-900 pt-16 pb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px]" />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex w-14 h-14 bg-emerald-500 rounded-2xl items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-500/20">
              <Upload size={28} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
              Share Resources
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              Upload PDFs — past papers, notes, or reference material — and help the MBM community.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-10 pb-24">

          {/* Success state */}
          {success ? (
            <div className="glass-card p-10 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Upload Successful!</h2>
              <p className="text-slate-500 mb-6">Your file is now available to the community.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={success.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  Preview PDF
                </a>
                <button
                  onClick={() => setSuccess(null)}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  Upload Another
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8">
              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-600">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !file && fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${dragOver
                    ? 'border-emerald-400 bg-emerald-50'
                    : file
                      ? 'border-emerald-400 bg-emerald-50/50 cursor-default'
                      : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />

                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <FileText size={24} className="text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 truncate max-w-[280px]">{file.name}</p>
                        <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Upload size={26} className="text-slate-400" />
                      </div>
                      <p className="font-bold text-slate-700 mb-1">Drop your PDF here, or click to browse</p>
                      <p className="text-sm text-slate-400">PDF only · Max {MAX_MB}MB</p>
                    </>
                  )}
                </div>

                {/* Branch + Semester */}
                <div className={`grid grid-cols-1 ${isSemesterOptional(form.branch) ? '' : 'sm:grid-cols-2'} gap-4`}>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Branch *
                    </label>
                    <select
                      name="branch"
                      value={form.branch}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                    >
                      <option value="">Select branch…</option>
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  {!isSemesterOptional(form.branch) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Semester *
                      </label>
                      <select
                        name="semester"
                        value={form.semester}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                      >
                        <option value="">Select semester…</option>
                        {SEMESTERS.map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Subject Name
                  </label>
                  <div className="relative">
                    <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="subjectName"
                      value={form.subjectName}
                      onChange={handleChange}
                      placeholder="e.g. Data Structures and Algorithms"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Paper / Notes Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. End Semester 2023 Question Paper"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Description <span className="normal-case font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any extra context about this file…"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-slate-900/15"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload size={16} /> Upload PDF</>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400">
                  You must be <button type="button" className="text-emerald-600 font-bold hover:underline" onClick={() => document.querySelector('[data-signin]')?.click()}>signed in</button> to upload.
                </p>
              </form>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
