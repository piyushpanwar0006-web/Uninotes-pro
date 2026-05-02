'use client';
import { useState } from 'react';
import {
  BookOpen, Users, Zap, Clock, ChevronDown,
  MessageSquare, ArrowRight, Layout, Mail, Send
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { blogs as blogData } from '@/lib/blogData';

// --- Why Uninote Section ---
export const WhyUninote = () => {
  const points = [
    { title: "Easy Access to Notes", description: "Find exactly what you need in seconds with our optimized search and categorization.", icon: <Layout className="w-6 h-6 text-emerald-500" /> },
    { title: "Verified by Seniors & Toppers", description: "High-quality material uploaded and verified by top-performing students from MBM.", icon: <Users className="w-6 h-6 text-emerald-500" /> },
    { title: "Focused on MBM Syllabus", description: "No more messy folders. Everything is sorted according to the latest MBM curriculum.", icon: <BookOpen className="w-6 h-6 text-emerald-500" /> },
    { title: "Made for MBM Exams", description: "Last-minute revision made easy with concise notes and semester-specific PYQs.", icon: <Clock className="w-6 h-6 text-emerald-500" /> }
  ];

  return (
    <section className="py-24" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>
            Why Use <span className="text-emerald-500">Uninote?</span>
          </h2>
          <p className="max-w-2xl mx-auto font-medium" style={{ color: 'var(--text-secondary)' }}>
            The ultimate academic resource hub designed specifically for engineering students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {points.map((point, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl border hover-lift transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-6">
                {point.icon}
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>{point.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Testimonials Section ---
export const Testimonials = () => {
  const reviews = [
    { name: "Divyansh singh", role: "2 Year, ECC", text: "Uninote helped me find last-minute notes before exams. Very useful and simple to use without any clutter." },
    { name: "Yuvranj Singh Sisodiya", role: "2nd Year, PE", text: "The collection of PYQs is amazing. It saved me so much time searching through old WhatsApp groups." },
    { name: "Amit Sharma", role: "4th Year, EE", text: "Practical and reliable. The notes are well-organized and the interface is very student-friendly." }
  ];

  return (
    <section className="py-24" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>
            Student <span className="text-emerald-500">Feedback</span>
          </h2>
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>What your peers are saying about us.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div key={index} className="glass-card p-8 hover-lift">
              <div className="flex gap-1 mb-4 text-emerald-500">
                {[...Array(5)].map((_, i) => (
                  <MessageSquare key={i} className="w-4 h-4 fill-emerald-500" />
                ))}
              </div>
              <p className="italic mb-6" style={{ color: 'var(--text-secondary)' }}>"{review.text}"</p>
              <div>
                <h4 className="font-bold" style={{ color: 'var(--text)' }}>{review.name}</h4>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{review.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- FAQ Section ---
export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    { question: "What is Uninote?", answer: "Uninote is a dedicated platform for engineering students to share and access academic resources like notes, previous year questions, and study guides." },
    { question: "Is the content free or paid?", answer: "Most of the academic content on Uninote is free to access. Our goal is to make education accessible to every student." },
    { question: "How reliable are the notes?", answer: "The notes are uploaded by students and reviewed by the community. We recommend checking the verified status badges for high-quality material." },
    { question: "Can I upload my own notes?", answer: "Yes! We encourage students to contribute. Simply create an account and use the upload section to share your notes with others." },
    { question: "Is login required?", answer: "You can browse and view most notes without logging in, but features like uploading and bookmarking require a quick account creation." }
  ];

  return (
    <section className="py-24" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>
            FAQ<span className="text-emerald-500 font-black">s</span>
          </h2>
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Everything you need to know about the platform.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl border transition-all duration-300"
              style={{
                borderColor: openIndex === index ? 'var(--primary)' : 'var(--border)',
                backgroundColor: 'var(--card)',
                boxShadow: openIndex === index ? '0 4px 24px -4px var(--primary-glow)' : 'none'
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-bold" style={{ color: 'var(--text)' }}>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-emerald-500' : ''}`}
                  style={{ color: openIndex === index ? undefined : 'var(--muted)' }}
                />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-5 text-sm leading-relaxed pt-4" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Blog Preview Section ---
export const BlogPreview = () => {
  const recentBlogs = blogData.slice(0, 3);

  return (
    <section className="py-24" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>
              Student <span className="text-emerald-500">Blog</span>
            </h2>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Tips, tricks, and guides for college life.</p>
          </div>
          <Link href="/blog" className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold hover:gap-3 transition-all duration-300">
            View All Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentBlogs.map((blog) => (
            <Link
              href={`/blog/${blog.slug}`}
              key={blog.id}
              className="rounded-3xl overflow-hidden border hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 group flex flex-col"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="relative h-48 w-full overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
                <Image
                  src={blog.imageUrl}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                />
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {blog.date}
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-emerald-500 transition-colors duration-300 line-clamp-2" style={{ color: 'var(--text)' }}>
                  {blog.title}
                </h3>
                <p className="text-sm mb-6 leading-relaxed line-clamp-3 flex-grow" style={{ color: 'var(--text-secondary)' }}>
                  {blog.metaDescription}
                </p>
                <div className="text-sm font-black flex items-center gap-2 group-hover:gap-3 transition-all duration-300 mt-auto" style={{ color: 'var(--text)' }}>
                  Read More <ArrowRight className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Contact Us Section ---
export const ContactUs = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null); // 'sending', 'success', 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => setStatus(null), 4000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus(null), 4000);
      }
    } catch (error) {
      setStatus('error');
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <section className="py-24 border-t" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>
            Get in <span className="text-emerald-500">Touch</span>
          </h2>
          <p className="font-medium max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Have a question, feedback, or want to report an issue? We'd love to hear from you.
          </p>
        </div>

        <div className="rounded-3xl border shadow-xl p-8 md:p-12 relative overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -z-0 rounded-full" />
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Email</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Message</label>
              <textarea
                required
                rows="4"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-y"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                placeholder="How can we help you?"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              {status === 'success' ? (
                <div className="text-sm font-bold text-emerald-500 flex items-center gap-2 animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Message sent successfully!
                </div>
              ) : status === 'error' ? (
                <div className="text-sm font-bold text-red-500 flex items-center gap-2 animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Failed to send message.
                </div>
              ) : (
                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  We usually respond within 24 hours.
                </p>
              )}
              
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
              >
                {status === 'sending' ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
