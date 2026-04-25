'use client';
import { useState } from 'react';
import {
  BookOpen,
  Users,
  Zap,
  Clock,
  ChevronDown,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Layout
} from 'lucide-react';

// --- Why Uninotes Section ---
export const WhyUninotes = () => {
  const points = [
    {
      title: "Easy Access to Notes",
      description: "Find exactly what you need in seconds with our optimized search and categorization.",
      icon: <Layout className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Verified by Seniors & Toppers",
      description: "High-quality material uploaded and verified by top-performing students from MBM.",
      icon: <Users className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Focused on MBM Syllabus",
      description: "No more messy folders. Everything is sorted according to the latest MBM curriculum.",
      icon: <BookOpen className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Made for MBM Exams",
      description: "Last-minute revision made easy with concise notes and semester-specific PYQs.",
      icon: <Clock className="w-6 h-6 text-emerald-500" />
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            Why Use <span className="text-emerald-500">Uninotes?</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            The ultimate academic resource hub designed specifically for engineering students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {points.map((point, index) => (
            <div key={index} className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover-lift">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                {point.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{point.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{point.description}</p>
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
    {
      name: "Divyansh singh",
      role: "2 Year, ECC",
      text: "Uninotes helped me find last-minute notes before exams. Very useful and simple to use without any clutter."
    },
    {
      name: "Yuvranj Singh Sisodiya",
      role: "2nd Year, PE",
      text: "The collection of PYQs is amazing. It saved me so much time searching through old WhatsApp groups."
    },
    {
      name: "Amit Sharma",
      role: "4th Year, EE",
      text: "Practical and reliable. The notes are well-organized and the interface is very student-friendly."
    }
  ];

  return (
    <section className="py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            Student <span className="text-emerald-500">Feedback</span>
          </h2>
          <p className="text-slate-500 font-medium">What your peers are saying about us.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div key={index} className="glass-card p-8 hover-lift">
              <div className="flex gap-1 mb-4 text-emerald-500">
                {[...Array(5)].map((_, i) => (
                  <MessageSquare key={i} className="w-4 h-4 fill-emerald-500" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-6">"{review.text}"</p>
              <div>
                <h4 className="font-bold text-slate-900">{review.name}</h4>
                <p className="text-sm text-emerald-600 font-medium">{review.role}</p>
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
    {
      question: "What is Uninotes?",
      answer: "Uninotes is a dedicated platform for engineering students to share and access academic resources like notes, previous year questions, and study guides."
    },
    {
      question: "Is the content free or paid?",
      answer: "Most of the academic content on Uninotes is free to access. Our goal is to make education accessible to every student."
    },
    {
      question: "How reliable are the notes?",
      answer: "The notes are uploaded by students and reviewed by the community. We recommend checking the verified status badges for high-quality material."
    },
    {
      question: "Can I upload my own notes?",
      answer: "Yes! We encourage students to contribute. Simply create an account and use the upload section to share your notes with others."
    },
    {
      question: "Is login required?",
      answer: "You can browse and view most notes without logging in, but features like uploading and bookmarking require a quick account creation."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            FAQ<span className="text-emerald-500 font-black">s</span>
          </h2>
          <p className="text-slate-500 font-medium">Everything you need to know about the platform.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border rounded-2xl transition-all duration-300 ${openIndex === index ? 'border-emerald-500 shadow-lg shadow-emerald-500/5' : 'border-slate-100'}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-bold text-slate-900">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-emerald-500' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-5 text-slate-500 text-sm leading-relaxed border-t border-slate-50 pt-4">
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
  const blogs = [
    {
      title: "How to Prepare for Exams in 7 Days",
      description: "A comprehensive guide on managing your time and focusing on high-weightage topics.",
      date: "May 15, 2024"
    },
    {
      title: "Best Study Techniques for College",
      description: "Exploring active recall and spaced repetition to improve long-term memory retention.",
      date: "May 12, 2024"
    },
    {
      title: "Last-Minute Revision Tips",
      description: "Quick hacks and mind-mapping techniques to breeze through your finals.",
      date: "May 10, 2024"
    }
  ];

  return (
    <section className="py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Student <span className="text-emerald-500">Blog</span>
            </h2>
            <p className="text-slate-500 font-medium">Tips, tricks, and guides for college life.</p>
          </div>
          <button className="flex items-center gap-2 text-emerald-600 font-bold hover:gap-3 transition-all duration-300">
            View All Articles <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogs.map((blog, index) => (
            <div key={index} className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 group">
              <div className="h-48 bg-emerald-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-emerald-500/40 group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>
              <div className="p-8">
                <div className="text-xs font-bold text-emerald-600 mb-4 uppercase tracking-wider">{blog.date}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">{blog.title}</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">{blog.description}</p>
                <button className="text-sm font-black text-slate-900 flex items-center gap-2 hover:gap-3 transition-all duration-300">
                  Read More <ArrowRight className="w-4 h-4 text-emerald-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
