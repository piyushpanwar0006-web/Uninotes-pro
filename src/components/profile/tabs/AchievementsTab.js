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
        <h2 className="text-lg font-black text-slate-900">Achievements</h2>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200 px-2.5 py-1 rounded-full">
          {earned.length} / {BADGES.length} unlocked
        </span>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>Overall Progress</span>
          <span className="text-emerald-600 font-bold">{Math.round((earned.length / BADGES.length) * 100)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
            style={{ width: `${(earned.length / BADGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Earned */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Earned</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {earned.map((b) => <BadgeCard key={b.title} badge={b} />)}
        </div>
      </div>

      {/* Locked */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Locked</h3>
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
          ? 'bg-white border-slate-200/70 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-200'
          : 'bg-slate-50/60 border-slate-200/40 opacity-50 cursor-not-allowed'
      }`}
    >
      <span className={`text-3xl ${!earned ? 'grayscale' : ''}`}>{emoji}</span>
      <div>
        <p className={`text-xs font-black leading-tight ${earned ? 'text-slate-800' : 'text-slate-500'}`}>{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-tight">{desc}</p>
      </div>
      {!earned && (
        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">Locked</span>
      )}
    </div>
  );
}
