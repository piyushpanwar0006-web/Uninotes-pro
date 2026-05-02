import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Target, ShieldCheck, FolderTree, Users, Zap, CheckCircle2, Search, Download, UploadCloud } from 'lucide-react';

export const metadata = {
  title: "About UniNotes",
  description: "Learn about UniNotes - the platform built for engineering students to access notes, PYQs and study resources."
};

export default function AboutPage() {
  const whyFeatures = [
    { title: "Verified by Seniors", desc: "Notes and resources are shared and verified by actual students and toppers.", icon: <ShieldCheck className="w-6 h-6 text-emerald-500" /> },
    { title: "Organized Library", desc: "Easily navigate through structured branches and semesters without the clutter.", icon: <FolderTree className="w-6 h-6 text-emerald-500" /> },
    { title: "Community Driven", desc: "A platform built by the community, for the community, ensuring content stays relevant.", icon: <Users className="w-6 h-6 text-emerald-500" /> },
    { title: "Fast & Easy Access", desc: "Find what you need in seconds with our optimized search and intuitive UI.", icon: <Zap className="w-6 h-6 text-emerald-500" /> }
  ];

  const howItWorks = [
    { step: "1", title: "Choose Branch", desc: "Select your engineering branch from our comprehensive catalog.", icon: <Search className="w-5 h-5 text-emerald-500" /> },
    { step: "2", title: "Select Semester", desc: "Pick the semester you are currently studying or preparing for.", icon: <FolderTree className="w-5 h-5 text-emerald-500" /> },
    { step: "3", title: "Access Notes", desc: "Instantly view, download, or bookmark notes and PYQs.", icon: <Download className="w-5 h-5 text-emerald-500" /> },
    { step: "4", title: "Upload Yours", desc: "Contribute back to the community by sharing your own materials.", icon: <UploadCloud className="w-5 h-5 text-emerald-500" /> }
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />
      
      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-b from-emerald-500/10 to-transparent -z-10 pointer-events-none blur-3xl" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6" style={{ color: 'var(--text)' }}>
              About <span className="text-emerald-500">UniNotes</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>
              Built for students, by students.
            </p>
          </div>
        </section>

        {/* MISSION SECTION */}
        <section className="py-16" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-emerald-100 dark:ring-emerald-900/50">
              <Target className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black mb-6" style={{ color: 'var(--text)' }}>Our Mission</h2>
            <p className="text-lg md:text-xl font-medium leading-relaxed max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Our mission is to simplify learning by providing verified notes, PYQs, and study resources for engineering students. We believe that access to quality educational materials should be seamless and free from clutter.
            </p>
          </div>
        </section>

        {/* WHY UNINOTES SECTION */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>Why UniNotes?</h2>
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Features that make studying efficient.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {whyFeatures.map((feat, idx) => (
                <div key={idx} className="p-8 rounded-2xl border hover:-translate-y-1 hover:shadow-lg transition-all duration-300" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-6">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>{feat.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-20 border-y" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>How It Works</h2>
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Your path to better preparation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Optional connecting line for desktop */}
              <div className="hidden lg:block absolute top-12 left-24 right-24 h-0.5 bg-gradient-to-r from-emerald-100 via-emerald-200 to-emerald-100 dark:from-emerald-900/30 dark:via-emerald-700/50 dark:to-emerald-900/30 -z-0" />
              
              {howItWorks.map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border-2 flex items-center justify-center text-xl font-black mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300" style={{ borderColor: 'var(--border)' }}>
                    {step.step}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {step.icon}
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{step.title}</h3>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMMUNITY & CTA SECTION */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight" style={{ color: 'var(--text)' }}>
              UniNotes is powered by <span className="text-emerald-500">students helping students.</span>
            </h2>
            <p className="text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Join UniNotes today and start learning smarter. Every upload helps a peer succeed.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/25"
            >
              <UploadCloud size={20} />
              Upload Notes
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
