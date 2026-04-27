import React from 'react';
import { Skeleton } from './ui/Skeleton';

/**
 * Skeleton representation of a PaperCard.
 * Mimics the exact layout of the PaperCard to prevent layout shifts during loading.
 */
export default function PaperSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
      {/* Header (Icon + Title/Desc) */}
      <div className="flex items-start gap-4">
        {/* Icon Skeleton */}
        <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
        
        {/* Text Skeleton */}
        <div className="flex-grow min-w-0 pr-8 space-y-2 mt-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>

      {/* Subject Badge Skeleton */}
      <Skeleton className="h-6 w-24 rounded-xl" />

      {/* Meta tags Skeleton */}
      <div className="flex items-center gap-3 mt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-4 w-8 rounded-full" />
      </div>

      {/* Action Button Skeleton */}
      <Skeleton className="h-10 w-full rounded-xl mt-auto" />
    </div>
  );
}
