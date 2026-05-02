import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, ArrowLeft, Calendar } from 'lucide-react';
import { blogs } from '@/lib/blogData';

// Generate static params for all blogs to ensure fast loading
export async function generateStaticParams() {
  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = blogs.find((b) => b.slug === slug);

  if (!blog) {
    return { title: 'Post Not Found | UniNote' };
  }

  return {
    title: `${blog.title} | UniNote Blog`,
    description: blog.metaDescription,
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const blog = blogs.find((b) => b.slug === slug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-slate-50 pt-32 pb-16 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            {blog.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-slate-500 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{blog.date}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <span>Study Guide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="relative w-full aspect-[2/1] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 border-4 border-white bg-slate-100">
          <Image
            src={blog.imageUrl}
            alt={blog.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div 
          className="prose prose-slate prose-lg max-w-none
                     prose-headings:font-black prose-headings:text-slate-900 
                     prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                     prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                     prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6
                     prose-a:text-emerald-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                     prose-ul:list-disc prose-ul:pl-6 prose-ul:text-slate-600 prose-ul:mb-6
                     prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-slate-600 prose-ol:mb-6
                     prose-li:mb-2
                     prose-strong:font-bold prose-strong:text-slate-900"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
        
        {/* Footer CTA */}
        <div className="mt-16 bg-slate-50 rounded-3xl p-8 md:p-12 text-center border border-slate-100">
          <h3 className="text-2xl font-black text-slate-900 mb-4">Ready to start studying?</h3>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">Get access to thousands of verified notes, previous year questions, and study materials on UniNote.</p>
          <Link href="/" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1">
            Explore Study Materials
          </Link>
        </div>
      </div>
    </div>
  );
}
