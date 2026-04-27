import React from 'react';

/**
 * A basic, reusable Skeleton component that adds a shimmer effect.
 * Use it to build larger skeleton structures by providing className with sizing utilities.
 * 
 * @param {string} className - Tailwind classes to define size, shape, and margins.
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/60 ${className}`}
      {...props}
    />
  );
}
