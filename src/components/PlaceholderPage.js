import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function GenericPage({ title, description }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-black mb-4" style={{ color: 'var(--text)' }}>{title}</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>{description || "This feature is currently being migrated to the new Next.js architecture. Stay tuned!"}</p>
          <a href="/" className="btn btn-primary">Back to Home</a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
