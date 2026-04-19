import Link from 'next/link';
import BranchCard from './BranchCard';
import { ArrowRight } from 'lucide-react';

const branches = [
  { name: "Civil Semester" },
  { name: "Mechanical Semester" },
  { name: "B.E. Computer Science and Engineering (CSE)" },
  { name: "B.E. Information Technology (IT)" },
  { name: "B.E. Artificial Intelligence and Data Science (AI&DS)" },
  { name: "B.E. Chemical Engineering (CE)" },
  { name: "B.E. Civil Engineering (CE)" },
  { name: "B.E. Electrical Engineering (EE)" },
  { name: "B.E. Electronics and Communication Engineering (ECE)" },
  { name: "B.E. Electronics and Computer Engineering (ECC)" },
  { name: "B.E. Electronics and Electrical Engineering (EEE)" },
  { name: "B.E. Mechanical Engineering (ME)" },
  { name: "B.E. Mining Engineering (MI)" },
  { name: "B.E. Petroleum Engineering (PE)" },
  { name: "B.E. Production and Industrial Engineering (P&I)" },
  { name: "B.E. Building and Construction Technology (BCT)" },
  { name: "Bachelor of Architecture (B.Arch)" },
];

export default function BranchCatalog({ limit }) {
  const displayBranches = limit ? branches.slice(0, limit) : branches;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayBranches.map((branch, index) => (
          <BranchCard key={index} name={branch.name} />
        ))}
      </div>

      {limit && (
        <div className="flex justify-center">
          <Link
            href="/branches"
            className="btn-premium-secondary hover:text-emerald-600 hover:border-emerald-200 group"
          >
            Show All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
