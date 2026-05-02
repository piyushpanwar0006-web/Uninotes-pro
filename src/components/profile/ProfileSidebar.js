'use client';
import {
  LayoutDashboard, Upload, Bookmark, Download, Trophy, Settings, LogOut, Edit3,
} from 'lucide-react';
import { useProfileFetch } from '@/lib/hooks/useProfileFetch';

const NAV_ITEMS = [
  { id: 'overview',     label: 'Overview',     icon: LayoutDashboard },
  { id: 'uploads',      label: 'My Uploads',   icon: Upload },
  { id: 'saved',        label: 'Saved Notes',  icon: Bookmark },
  { id: 'downloads',    label: 'Downloads',    icon: Download },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'settings',     label: 'Settings',     icon: Settings },
];

export default function ProfileSidebar({ user, activeTab, onChange }) {
  const { data: profile } = useProfileFetch('/api/profile');
  const name      = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email     = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const branch    = profile?.branch   ?? null;
  const semester  = profile?.semester ?? null;

  const initials = () => {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Avatar & Identity */}
      <div className="px-6 pt-8 pb-6 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative inline-block mb-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-100 dark:ring-emerald-900/50 shadow-md" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-black ring-4 ring-emerald-100 dark:ring-emerald-900/50 shadow-md">
              {initials()}
            </div>
          )}
          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
        </div>

        <h2 className="text-base font-black leading-tight truncate" style={{ color: 'var(--text)' }}>{name}</h2>
        <p className="text-xs font-medium mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{email}</p>
        {(branch || semester) && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {branch ?? ''}{branch && semester ? ' • ' : ''}{semester ? `Sem ${semester}` : ''}
          </p>
        )}

        <button
          onClick={() => onChange('settings')}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-200 hover:border-emerald-400 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <Edit3 size={13} />
          Edit Profile
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600'
              }`}
              style={active ? undefined : { color: 'var(--text-secondary)' }}
            >
              <Icon size={16} className={active ? 'text-emerald-600 dark:text-emerald-400' : ''} style={active ? undefined : { color: 'var(--muted)' }} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 mt-1 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
