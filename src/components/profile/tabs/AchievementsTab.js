'use client';

const BADGES = [
  { emoji: '🚀', title: 'First Upload',         desc: 'Uploaded your first note',          earned: true  },
  { emoji: '⭐', title: 'Rising Star',           desc: '5 uploads approved',                earned: true  },
  { emoji: '🔥', title: 'On Fire',               desc: '3 uploads in a single week',        earned: true  },
  { emoji: '📚', title: 'Knowledge Sharer',      desc: '10+ approved uploads',              earned: false },
  { emoji: '💎', title: 'Top Contributor',       desc: '500+ total downloads on uploads',   earned: false },
  { emoji: '🎓', title: 'Senior Scholar',        desc: 'Active for 6+ months',              earned: false },
  { emoji: '🏆', title: 'Legend',                desc: '1000+ downloads achieved',          earned: false },
  { emoji: '🌟', title: 'Community Hero',        desc: 'Helped 1000+ students',             earned: false },
];

export default function AchievementsTab() {
  const earned = BADGES.filter((b) => b.earned);
  const locked = BADGES.filter((b) => !b.earned);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>Achievements</h2>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>
          {earned.length} / {BADGES.length} unlocked
        </span>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl border shadow-sm p-5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
          <span>Overall Progress</span>
          <span className="text-emerald-600 font-bold">{Math.round((earned.length / BADGES.length) * 100)}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
            style={{ width: `${(earned.length / BADGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Earned */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>Earned</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {earned.map((b) => <BadgeCard key={b.title} badge={b} />)}
        </div>
      </div>

      {/* Locked */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>Locked</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {locked.map((b) => <BadgeCard key={b.title} badge={b} />)}
        </div>
      </div>
    </div>
  );
}

function BadgeCard({ badge }) {
  const { emoji, title, desc, earned } = badge;
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col items-center gap-2 text-center transition-all duration-200 ${
        earned
          ? 'shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400'
          : 'opacity-50 cursor-not-allowed'
      }`}
      style={earned ? { backgroundColor: 'var(--surface)', borderColor: 'var(--border)' } : { backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <span className={`text-3xl ${!earned ? 'grayscale' : ''}`}>{emoji}</span>
      <div>
        <p className="text-xs font-black leading-tight" style={{ color: earned ? 'var(--text)' : 'var(--text-secondary)' }}>{title}</p>
        <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--muted)' }}>{desc}</p>
      </div>
      {!earned && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)' }}>Locked</span>
      )}
    </div>
  );
}
