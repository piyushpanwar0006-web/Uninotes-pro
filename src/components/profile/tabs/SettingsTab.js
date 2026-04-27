'use client';
import { useState, useEffect } from 'react';
import { Camera, Eye, EyeOff, Save, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useProfileFetch } from '@/lib/hooks/useProfileFetch';
import { ErrorBanner } from '@/components/profile/TabShells';

const BRANCHES  = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'Chem E', 'Other'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

// ── Skeleton loader for the profile form fields ───────────────────────────────
function FieldSkeleton() {
  return <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-full" />;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SettingsTab({ user }) {
  // Load real profile from DB
  const { data: profileData, loading: profileLoading, error: profileError } = useProfileFetch('/api/profile');

  // Profile form state — pre-populated once data arrives
  const [form, setForm]         = useState({ full_name: '', college: '', branch: 'CSE', semester: '1' });
  const [saving,  setSaving]    = useState(false);
  const [saveMsg, setSaveMsg]   = useState(null); // { type: 'ok'|'err', text }

  // Sync form when profile data loads
  useEffect(() => {
    if (profileData) {
      setForm({
        full_name: profileData.full_name ?? '',
        college:   profileData.college   ?? '',
        branch:    BRANCHES.includes(profileData.branch) ? profileData.branch : 'CSE',
        semester:  profileData.semester  ? String(profileData.semester) : '1',
      });
    }
  }, [profileData]);

  // Password form state
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw]   = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]     = useState(null); // { type: 'ok'|'err', text }

  const email = user?.email ?? profileData?.email ?? '';

  // ── Profile form handlers ──────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaveMsg(null);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name || undefined,
          college:   form.college   || undefined,
          branch:    form.branch    || undefined,
          semester:  Number(form.semester) || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveMsg({ type: 'ok', text: 'Profile saved successfully.' });
      } else {
        setSaveMsg({ type: 'err', text: json.error || 'Failed to save.' });
      }
    } catch {
      setSaveMsg({ type: 'err', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  // ── Password change handlers ───────────────────────────────────────────────
  const handlePwChange = (e) => {
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPwMsg(null);
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (!pwForm.current)             { setPwMsg({ type: 'err', text: 'Enter your current password.' }); return; }
    if (pwForm.next.length < 8)      { setPwMsg({ type: 'err', text: 'New password must be ≥ 8 characters.' }); return; }
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type: 'err', text: 'Passwords do not match.' }); return; }

    setPwSaving(true);
    setPwMsg(null);
    try {
      // Supabase handles password change by calling updateUser on the browser client.
      // We do this client-side because it requires the user's current session token.
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pwForm.next });
      if (error) {
        setPwMsg({ type: 'err', text: error.message });
      } else {
        setPwMsg({ type: 'ok', text: 'Password updated successfully.' });
        setPwForm({ current: '', next: '', confirm: '' });
      }
    } catch {
      setPwMsg({ type: 'err', text: 'Network error. Please try again.' });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 5000);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const togglePw = (field) => setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black text-slate-900">Settings</h2>

      {profileError && <ErrorBanner message={profileError} />}

      {/* ── Profile Info ─────────────────────────────────────────────────── */}
      <SectionCard title="Profile Information" icon="🧑">
        <form onSubmit={handleProfileSave} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xl font-black ring-4 ring-slate-100">
                  {(form.full_name || user?.email || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                aria-label="Upload avatar"
                title="Avatar upload coming soon"
                disabled
                className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm cursor-not-allowed"
              >
                <Camera size={12} />
              </button>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Profile Photo</p>
              <p className="text-xs text-slate-400 mt-0.5">JPG or PNG — coming soon</p>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profileLoading ? (
              <>
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
              </>
            ) : (
              <>
                <SettingsField
                  label="Full Name"
                  id="full_name"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
                <SettingsField
                  label="Email"
                  id="email"
                  name="email"
                  value={email}
                  readOnly
                  placeholder="—"
                  hint="Email cannot be changed here."
                />
                <SettingsField
                  label="College"
                  id="college"
                  name="college"
                  value={form.college}
                  onChange={handleChange}
                  placeholder="e.g. MBM University"
                />
                {/* Branch */}
                <div className="space-y-1.5">
                  <label htmlFor="branch" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Branch</label>
                  <select
                    id="branch"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  >
                    {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                {/* Semester */}
                <div className="space-y-1.5">
                  <label htmlFor="semester" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Semester</label>
                  <select
                    id="semester"
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  >
                    {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || profileLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saveMsg && (
              <span className={`text-xs font-semibold flex items-center gap-1 animate-fade-in ${saveMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                {saveMsg.type === 'ok' ? <CheckCircle2 size={13} /> : <ShieldAlert size={13} />}
                {saveMsg.text}
              </span>
            )}
          </div>
        </form>
      </SectionCard>

      {/* ── Security ─────────────────────────────────────────────────────── */}
      <SectionCard title="Security" icon="🔐">
        <form onSubmit={handlePwSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordField
              label="Current Password"
              id="current"
              name="current"
              value={pwForm.current}
              onChange={handlePwChange}
              show={showPw.current}
              onToggle={() => togglePw('current')}
            />
            <div /> {/* spacer */}
            <PasswordField
              label="New Password"
              id="next"
              name="next"
              value={pwForm.next}
              onChange={handlePwChange}
              show={showPw.next}
              onToggle={() => togglePw('next')}
            />
            <PasswordField
              label="Confirm New Password"
              id="confirm"
              name="confirm"
              value={pwForm.confirm}
              onChange={handlePwChange}
              show={showPw.confirm}
              onToggle={() => togglePw('confirm')}
            />
          </div>

          {pwForm.next && <PasswordStrength password={pwForm.next} />}

          {pwMsg && (
            <div className={`flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 border ${
              pwMsg.type === 'ok'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {pwMsg.type === 'ok' ? <CheckCircle2 size={13} /> : <ShieldAlert size={13} />}
              {pwMsg.text}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pwSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pwSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>

        {/* Sign out all sessions */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium mb-3">
            This will sign you out from all devices including this one.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition-all duration-200 active:scale-95"
          >
            <LogOut size={14} />
            Sign Out of All Sessions
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 space-y-5">
      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function SettingsField({ label, id, name, value, onChange, placeholder, readOnly = false, required = false, hint }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-all ${
          readOnly
            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            : 'bg-white text-slate-700 border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400'
        }`}
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function PasswordField({ label, id, name, value, onChange, show, onToggle }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

function PasswordStrength({ password }) {
  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors  = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'];
  const textCls = strength >= 3 ? 'text-emerald-600' : strength === 2 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? colors[strength] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${textCls}`}>{labels[strength]}</p>
    </div>
  );
}
