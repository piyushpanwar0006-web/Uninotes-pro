import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';
import { blogs } from '@/lib/blogData';

export const metadata = {
  title: 'Engineering Blog & Study Guides | UniNote',
  description: 'Read the latest guides on engineering notes, PYQs, exam preparation, and study materials for B.Tech students.',
};

export default function BlogListingPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            UniNote <span className="text-emerald-500">Blog</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Discover the best study strategies, exam hacks, and detailed guides to making the most out of your engineering resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Link href={`/blog/${blog.slug}`} key={blog.id} className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                <Image
                  src={blog.imageUrl}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-4 uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>{blog.date}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {blog.title}
                </h2>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed line-clamp-3 flex-grow">
                  {blog.metaDescription}
                </p>
                <div className="text-sm font-black text-slate-900 flex items-center gap-2 group-hover:gap-3 transition-all mt-auto">
                  Read Article <ArrowRight className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
