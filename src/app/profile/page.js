'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import MobileTabBar from '@/components/profile/MobileTabBar';
import OverviewTab from '@/components/profile/tabs/OverviewTab';
import UploadsTab from '@/components/profile/tabs/UploadsTab';
import SavedNotesTab from '@/components/profile/tabs/SavedNotesTab';
import DownloadsTab from '@/components/profile/tabs/DownloadsTab';
import AchievementsTab from '@/components/profile/tabs/AchievementsTab';
import SettingsTab from '@/components/profile/tabs/SettingsTab';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TAB_CONTENT = {
    overview: <OverviewTab user={user} />,
    uploads: <UploadsTab />,
    saved: <SavedNotesTab />,
    downloads: <DownloadsTab />,
    achievements: <AchievementsTab />,
    settings: <SettingsTab user={user} />,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: 'var(--card)' }}>🔒</div>
          <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>Sign in required</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Please sign in to access your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile tab bar sits above content */}
      <div className="lg:hidden mb-6">
        <MobileTabBar activeTab={activeTab} onChange={setActiveTab} user={user} />
      </div>

      <div className="flex gap-8 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
          <ProfileSidebar user={user} activeTab={activeTab} onChange={setActiveTab} />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 animate-fade-in">
          {TAB_CONTENT[activeTab] ?? TAB_CONTENT.overview}
        </div>
      </div>
    </div>
  );
}
