'use client';
import { FaGithub, FaTwitter as X } from 'react-icons/fa';
import { MdOutlineMail as Mail } from 'react-icons/md';

const LinkedInIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="pt-20 pb-10 mt-auto" style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <span className="text-sm font-black">U</span>
              </div>
              <span className="text-xl font-black tracking-tighter" style={{ color: 'var(--text)' }}>
                Uni<span className="text-emerald-500">notes</span>
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed mb-6" style={{ color: 'var(--muted)' }}>
              The smartest, fastest, and most trusted way to learn and prepare
              for MBM University engineering exams.
            </p>
            <div className="flex items-center gap-4" style={{ color: 'var(--muted)' }}>
              <X className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />
              <FaGithub className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />
              <LinkedInIcon className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />
              <Mail className="w-5 h-5 hover:text-emerald-500 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: 'var(--text)' }}>Explore</h4>
            <ul className="space-y-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {['Study Path', 'Branch Catalog', 'Lecture Notes', 'Test Preparation'].map(item => (
                <li key={item} className="hover:text-emerald-500 cursor-pointer transition-colors">{item}</li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: 'var(--text)' }}>Support</h4>
            <ul className="space-y-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {['Help Center', 'Privacy Policy', 'Terms of Service', 'Contact Us'].map(item => (
                <li key={item} className="hover:text-emerald-500 cursor-pointer transition-colors">{item}</li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: 'var(--text)' }}>Community</h4>
            <ul className="space-y-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {['Upload Notes', 'MBM Community'].map(item => (
                <li key={item} className="hover:text-emerald-500 cursor-pointer transition-colors">{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            © {new Date().getFullYear()} MBM University, Jodhpur. Excellence in Engineering.
          </p>
        </div>
      </div>
    </footer>
  );
}
