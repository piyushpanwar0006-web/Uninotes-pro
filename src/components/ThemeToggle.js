'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* Read the applied theme from <html> class on mount */
  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  /* Prevent hydration mismatch — render nothing until client mount */
  if (!mounted) {
    return <div className={`w-9 h-9 rounded-xl ${className}`} />;
  }

  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-300
        ${isDark
          ? 'bg-slate-700 border-slate-600 text-amber-400 hover:bg-slate-600 hover:border-slate-500'
          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:border-slate-300'
        } ${className}`}
    >
      {isDark
        ? <Sun size={16} className="transition-transform duration-300 rotate-0 scale-100" />
        : <Moon size={16} className="transition-transform duration-300 rotate-0 scale-100" />
      }
    </button>
  );
}
