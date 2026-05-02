import "./globals.css";
import { Inter } from "next/font/google";
import * as Sentry from "@sentry/nextjs";
import QueryProvider from "@/components/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Uninotes - Official Study Resources",
  description: "The smartest way to ace your exams",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        {/* ── Anti-FOUC: apply theme before first paint ── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <QueryProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
