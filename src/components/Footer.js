'use client';
import { Github, Twitter, Mail } from 'lucide-react';

// Inline LinkedIn SVG — lucide-react renamed this icon across versions
const LinkedInIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <span className="text-sm font-black">U</span>
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">
                Uni<span className="text-emerald-500">notes</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
              The smartest, fastest, and most trusted way to learn and prepare 
              for MBM University engineering exams.
            </p>
            <div className="flex items-center gap-4 text-slate-400">
              {Twitter && <Twitter className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />}
              {Github && <Github className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />}
              <LinkedInIcon className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />
              {Mail && <Mail className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Explore</h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-500">
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Study Path</li>
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Branch Catalog</li>
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Lecture Notes</li>
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Test Preparation</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Community</h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-500">
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Upload Notes</li>
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Ambassador Program</li>
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Student Forum</li>
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">MBM Community</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-500">
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Help Center</li>
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-emerald-500 cursor-pointer transition-colors">Contact Us</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            © {new Date().getFullYear()} MBM University, Jodhpur. Excellence in Engineering.
          </p>
        </div>
      </div>
    </footer>
  );
}
