'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { branchData } from '@/data/branches';

// Flatten branchData into a searchable array
const flattenedData = [];
Object.entries(branchData).forEach(([branchName, semesters]) => {
  flattenedData.push({
    type: 'branch',
    name: branchName,
    branch: branchName,
    searchString: branchName.toLowerCase(),
  });

  Object.entries(semesters).forEach(([semester, subjects]) => {
    subjects.forEach((subject) => {
      flattenedData.push({
        type: 'subject',
        name: subject.name,
        code: subject.code,
        branch: branchName,
        semester: semester,
        searchString: `${subject.name} ${subject.code || ''} ${branchName}`.toLowerCase(),
      });
    });
  });
});

export default function HomeSearch({ onActiveChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Notify parent when the active state changes
  const isDropdownActive = isFocused && query.trim().length > 0;
  useEffect(() => {
    onActiveChange?.(isDropdownActive);
  }, [isDropdownActive, onActiveChange]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    // Use a Set to ensure we don't show duplicate subject names unnecessarily
    const seenSubjects = new Set();
    
    const filtered = flattenedData
      .filter((item) => {
        if (!item.searchString.includes(lowerQuery)) return false;
        
        // Deduplicate subjects with the same name across branches unless the user is specifically searching for that branch
        if (item.type === 'subject') {
          if (!seenSubjects.has(item.name.toLowerCase())) {
            seenSubjects.add(item.name.toLowerCase());
            return true;
          }
          return false;
        }
        return true;
      })
      .slice(0, 6); // Limit to 6 results for the dropdown UI

    setResults(filtered);
  }, [query]);

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.name);
    setIsFocused(false);

    if (item.type === 'branch') {
      router.push(`/branches/${encodeURIComponent(item.branch)}`);
    } else {
      router.push(`/branches/${encodeURIComponent(item.branch)}#sem-${item.semester}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelect(results[0]);
    }
  };

  return (
    <div className="relative group animate-fade-in stagger-3 w-full" ref={dropdownRef}>
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
      
      {/* Input container */}
      <form 
        onSubmit={handleSubmit}
        className="relative flex items-center bg-white rounded-2xl p-2 shadow-2xl shadow-slate-200 border border-slate-100 z-10"
      >
        <Search className="ml-4 text-slate-400 w-5 h-5 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="What subject or topic do you want to study today?"
          className="flex-grow px-4 py-3 outline-none text-slate-900 font-medium placeholder:text-slate-400 bg-transparent min-w-0 text-sm sm:text-base"
          autoComplete="off"
        />
        <button type="submit" className="btn-premium-primary text-sm shrink-0">
          Search
        </button>
      </form>

      {/* Auto-complete Dropdown */}
      {isFocused && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in origin-top">
          {results.length > 0 ? (
            <div className="p-2">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Suggested Results
              </div>
              <ul className="flex flex-col gap-1">
                {results.map((item, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group/item"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                        {item.type === 'branch' ? <BookOpen size={18} /> : <Search size={18} />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="font-bold text-slate-900 truncate text-sm">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5 mt-0.5">
                          {item.type === 'branch' ? (
                            'Branch Catalog'
                          ) : (
                            <>
                              <span className="text-emerald-600 font-bold">{item.branch}</span>
                              <ChevronRight size={10} className="text-slate-300" />
                              Semester {item.semester}
                            </>
                          )}
                        </div>
                      </div>
                      {item.type === 'subject' && (
                        <div className="ml-auto shrink-0 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors flex items-center gap-1">
                          View Notes <ChevronRight size={10} />
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm font-medium">
              We couldn't find any subjects or branches matching "{query}". 
              <br/>Try searching for something else.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
