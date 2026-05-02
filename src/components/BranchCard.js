'use client';
import Link from 'next/link';
import {
  Building2, Settings, Zap, FlaskConical, Droplets, Factory,
  Cpu, ChevronRight, Compass, Monitor, Brain, Network,
  Radio, Microchip, Pickaxe, HardHat
} from 'lucide-react';

const iconMap = {
  'Chemical Engineering': FlaskConical,
  'Civil Engineering': Building2,
  'Electrical Engineering': Zap,
  'Mechanical Engineering': Settings,
  'Petroleum Engineering': Droplets,
  'Production & Industrial Engineering': Factory,
  'Electronics & Electrical Engineering': Cpu,
  'Building & Construction Technology': HardHat,
  'Bachelor of Architecture (B.Arch)': Compass,
  'B.E. Chemical Engineering (CE)': FlaskConical,
  'B.E. Civil Engineering (CE)': Building2,
  'B.E. Computer Science and Engineering (CSE)': Monitor,
  'B.E. Artificial Intelligence and Data Science (AI&DS)': Brain,
  'B.E. Information Technology (IT)': Network,
  'B.E. Electrical Engineering (EE)': Zap,
  'B.E. Electronics and Communication Engineering (ECE)': Radio,
  'B.E. Electronics and Computer Engineering (ECC)': Microchip,
  'B.E. Electronics and Electrical Engineering (EEE)': Cpu,
  'B.E. Mechanical Engineering (ME)': Settings,
  'B.E. Mining Engineering (MI)': Pickaxe,
  'B.E. Petroleum Engineering (PE)': Droplets,
  'B.E. Production and Industrial Engineering (P&I)': Factory,
  'B.E. Building and Construction Technology (BCT)': HardHat,
  'Civil Semester': Building2,
  'Mechanical Semester': Settings,
};

export default function BranchCard({ name }) {
  const IconComponent = iconMap[name] || Building2;
  const Icon = IconComponent || (() => <div className="w-10 h-10 rounded-lg animate-pulse" />);

  return (
    <Link
      href={`/branches/${encodeURIComponent(name)}`}
      className="group glass-card p-8 hover-lift flex flex-col items-center text-center h-full cursor-pointer relative overflow-hidden animate-scale-up"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 -mr-8 -mt-8 rounded-full group-hover:bg-emerald-500/10 transition-colors duration-500" />

      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-sm"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <Icon size={32} strokeWidth={1.5} />
      </div>

      <h3 className="text-xl font-black group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2" style={{ color: 'var(--text)' }}>
        {name}
      </h3>

      <p className="text-sm font-medium mb-6 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
        PYQs &amp; Notes Available
      </p>

      <div className="mt-auto flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-sm gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        Explore Pathway <ChevronRight size={16} />
      </div>
    </Link>
  );
}
