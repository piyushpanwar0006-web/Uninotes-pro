'use client';
/**
 * useAuth — lightweight shared hook for client-side session state.
 *
 * Returns:
 *   user      — Supabase User object | null (null = logged out)
 *   isLoading — true while the first session check is in flight
 *   isAuthed  — true when a valid session exists
 *
 * Usage:
 *   const { user, isLoading, isAuthed } = useAuth();
 */
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  // undefined means "not yet resolved" — distinguishable from null (logged out)
  const [user, setUser] = useState(undefined);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Resolve initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setUser(session?.user ?? null);
    });

    // Stay in sync with auth state changes (login / logout / token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user: user ?? null,
    isLoading: user === undefined,
    isAuthed: !!user,
  };
}
