'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EngagementActionsProps {
  resourceId: string;
  resourceType?: 'note' | 'paper';
  initialStats?: {
    avg_rating: number;
    rating_count: number;
    saved_count: number;
    userRating?: number;
    isBookmarked?: boolean;
  };
}

export default function EngagementActions({ resourceId, resourceType = 'note', initialStats }: EngagementActionsProps) {
  const [stats, setStats] = useState(
    initialStats || {
      avg_rating: 0,
      rating_count: 0,
      saved_count: 0,
      userRating: 0,
      isBookmarked: false,
    }
  );
  const [isFetching, setIsFetching] = useState(!initialStats);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isRating, setIsRating] = useState(false);

  useEffect(() => {
    if (!initialStats) {
      const fetchStats = async () => {
        try {
          const res = await fetch(`/api/${resourceType}s/${resourceId}/stats`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setStats((prev) => ({ ...prev, ...data.data }));
            }
          }
        } catch (error) {
          console.error('Failed to fetch stats', error);
        } finally {
          setIsFetching(false);
        }
      };
      fetchStats();
    }
  }, [resourceId, resourceType, initialStats]);

  const toggleBookmark = async () => {
    if (isBookmarking) return;

    // Optimistic UI Update
    const originalState = stats.isBookmarked;
    const originalCount = stats.saved_count;

    setStats((prev) => ({
      ...prev,
      isBookmarked: !prev.isBookmarked,
      saved_count: prev.isBookmarked ? Math.max(prev.saved_count - 1, 0) : prev.saved_count + 1,
    }));

    setIsBookmarking(true);
    try {
      const res = await fetch('/api/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resourceId, resource_type: resourceType }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle bookmark');
      }

      const data = await res.json();
      if (data.success) {
        // We sync exactly with what the server says
        setStats((prev) => ({
          ...prev,
          isBookmarked: data.data.isBookmarked,
        }));
      }
    } catch (error) {
      console.error(error);
      // Revert optimistic update
      setStats((prev) => ({
        ...prev,
        isBookmarked: originalState,
        saved_count: originalCount,
      }));
    } finally {
      setIsBookmarking(false);
    }
  };

  const rateNote = async (score: number) => {
    if (isRating || score === stats.userRating) return;

    const originalRating = stats.userRating;
    
    // Optimistic Update
    setStats((prev) => {
      const newCount = prev.userRating ? prev.rating_count : prev.rating_count + 1;
      // Rough optimistic average calculation
      const currentTotal = prev.avg_rating * prev.rating_count;
      const newTotal = currentTotal - (prev.userRating || 0) + score;
      const newAvg = newTotal / newCount;

      return {
        ...prev,
        userRating: score,
        rating_count: newCount,
        avg_rating: newAvg,
      };
    });

    setIsRating(true);
    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resourceId, resource_type: resourceType, rating: score }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit rating');
      }
    } catch (error) {
      console.error(error);
      // Refresh full stats to ensure correctness if it failed
      const fetchStats = async () => {
        try {
          const res = await fetch(`/api/${resourceType}s/${resourceId}/stats`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setStats((prev) => ({ ...prev, ...data.data }));
            }
          }
        } catch (e) {
           console.error(e);
        }
      };
      fetchStats();
    } finally {
      setIsRating(false);
    }
  };

  if (isFetching) {
    return <div className="flex gap-4 animate-pulse h-8 items-center bg-zinc-100 rounded-md w-32"></div>;
  }

  return (
    <div className="flex items-center gap-6 mt-4 p-3 bg-white border rounded-xl shadow-sm">
      {/* Bookmark Section */}
      <button
        onClick={toggleBookmark}
        disabled={isBookmarking}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all active:scale-95",
          stats.isBookmarked 
            ? "bg-blue-50 text-blue-600 hover:bg-blue-100" 
            : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
        )}
      >
        <Bookmark
          size={18}
          className={cn(stats.isBookmarked && "fill-blue-600")}
        />
        <span className="text-sm font-medium">
          {stats.saved_count} {stats.saved_count === 1 ? 'Save' : 'Saves'}
        </span>
      </button>

      {/* Rating Section */}
      <div className="flex items-center gap-3">
        <div className="flex text-amber-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => rateNote(star)}
              disabled={isRating}
              className={cn(
                "p-1 transition-transform hover:scale-110 focus:outline-none",
                star <= (stats.userRating || Math.round(stats.avg_rating))
                  ? "fill-amber-400 text-amber-400"
                  : "text-zinc-300 hover:text-amber-300"
              )}
            >
              <Star
                size={20}
                className={cn(
                  star <= (stats.userRating || Math.round(stats.avg_rating)) && "fill-amber-400"
                )}
              />
            </button>
          ))}
        </div>
        <div className="text-sm text-zinc-500 font-medium">
          {stats.avg_rating.toFixed(1)} ({stats.rating_count})
        </div>
      </div>
    </div>
  );
}
