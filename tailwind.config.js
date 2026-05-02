/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#003366",
          green: "#00A86B",
          light: "#F8FAFC",
        },
        // CSS-variable-backed theme tokens usable as Tailwind utilities
        theme: {
          bg:      'var(--bg)',
          surface: 'var(--surface)',
          card:    'var(--card)',
          border:  'var(--border)',
          text:    'var(--text)',
          muted:   'var(--muted)',
        },
      },
    },
  },
  plugins: [],
};
