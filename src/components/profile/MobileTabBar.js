'use client';
import { LayoutDashboard, Upload, Bookmark, Download, Trophy, Settings } from 'lucide-react';
import { useProfileFetch } from '@/lib/hooks/useProfileFetch';

const TABS = [
  { id: 'overview',     label: 'Overview',  icon: LayoutDashboard },
  { id: 'uploads',      label: 'Uploads',   icon: Upload },
  { id: 'saved',        label: 'Saved',     icon: Bookmark },
  { id: 'downloads',    label: 'Downloads', icon: Download },
  { id: 'achievements', label: 'Awards',    icon: Trophy },
  { id: 'settings',     label: 'Settings',  icon: Settings },
];

export default function MobileTabBar({ activeTab, onChange, user }) {
  const { data: profile } = useProfileFetch('/api/profile');
  const name    = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const branch  = profile?.branch   ?? null;
  const semester = profile?.semester ?? null;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = () => {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Mini Identity Card */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-100" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-base font-black ring-2 ring-emerald-100">
            {initials()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900 truncate">{name}</p>
          {(branch || semester) && (
            <p className="text-xs text-emerald-600 font-semibold">
              {branch ?? ''}{branch && semester ? ' • ' : ''}{semester ? `Sem ${semester}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Scrollable Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon size={16} className={active ? 'text-emerald-600' : 'text-slate-400'} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
