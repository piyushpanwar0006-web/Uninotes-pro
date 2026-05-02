import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'My Profile — Uninotes',
  description: 'Manage your uploads, saved notes, downloads, achievements and settings.',
};

export default function ProfileLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-grow">{children}</main>
    </div>
  );
}
