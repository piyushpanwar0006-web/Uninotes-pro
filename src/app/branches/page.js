import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BranchCatalog from '@/components/BranchCatalog';
import { LayoutGrid } from 'lucide-react';

export default function BranchesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-slate-900 pt-16 pb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] -z-0" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <LayoutGrid size={24} />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                Degree <span className="text-emerald-400">Pathways</span>
              </h1>
            </div>
            
            <p className="max-w-2xl text-lg text-slate-400 font-medium leading-relaxed">
              Explore the complete directory of engineering programs at MBM. 
              Find curated notes, verified PYQs, and academic resources for every branch.
            </p>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 -mt-12 relative z-20">
          <BranchCatalog />
        </section>
      </main>

      <Footer />
    </div>
  );
}
