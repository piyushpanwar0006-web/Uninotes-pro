'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BranchCatalog from '@/components/BranchCatalog';
import { Search, Users, Star, BookOpen, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-emerald-50/50 to-transparent -z-10 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-700 text-xs font-bold mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Trusted by 50,000+ Students
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-[1.1] animate-fade-in stagger-1">
              Study Smarter, <br />
              <span className="text-gradient">Not Harder.</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-12 font-medium leading-relaxed animate-fade-in stagger-2">
              Access the most comprehensive collection of engineering notes, 
              PYQs, and resource guides curated by the MBM community.
            </p>

            <div className="max-w-2xl mx-auto relative group animate-fade-in stagger-3">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex items-center bg-white rounded-2xl p-2 shadow-2xl shadow-slate-200 border border-slate-100">
                <Search className="ml-4 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="What subject or topic do you want to study today?" 
                  className="flex-grow px-4 py-3 outline-none text-slate-900 font-medium placeholder:text-slate-400"
                />
                <button className="btn-premium-primary text-sm">
                  Search
                </button>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                {Star && <Star className="text-yellow-500 fill-yellow-500 w-4 h-4" />}
                <span className="font-bold text-slate-900">4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                {Users && <Users className="text-emerald-500 w-4 h-4" />}
                <span className="font-bold text-slate-900">10k+ Resources</span>
              </div>
              <div className="flex items-center gap-2">
                {CheckCircle2 && <CheckCircle2 className="text-blue-500 w-4 h-4" />}
                <span className="font-bold text-slate-900">Verified Material</span>
              </div>
            </div>
          </div>
        </section>

        {/* Branch Catalog Section */}
        <section className="bg-white py-24 sm:py-32 rounded-t-[3rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.05)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-20">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight lg:text-5xl mb-6">
                Explore <span className="text-emerald-500">Branches</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium">
                Choose your engineering pathway to access comprehensive notes and practice materials.
              </p>
            </div>
            
            <BranchCatalog limit={4} />
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -z-0" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <div className="text-5xl font-black text-white">10k+</div>
                <div className="text-emerald-400 font-bold tracking-widest uppercase text-sm">Academic Resources</div>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-black text-white text-gradient bg-gradient-to-r from-emerald-400 to-blue-400">50k+</div>
                <div className="text-emerald-400 font-bold tracking-widest uppercase text-sm">Active Students</div>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-black text-white">#1</div>
                <div className="text-emerald-400 font-bold tracking-widest uppercase text-sm">Study Platform for MBM</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
