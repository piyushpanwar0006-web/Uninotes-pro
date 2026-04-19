'use client';
import { Mail } from 'lucide-react';

// Inline SVG icons — avoids lucide-react barrel optimization errors during build
const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const GithubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

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
              <XIcon className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />
              <GithubIcon className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />
              <LinkedInIcon className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />
              <Mail className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />
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
