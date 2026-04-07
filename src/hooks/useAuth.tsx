import { useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: string[];
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    loading: true,
  });
  const rolesFetchedForUser = useRef<string | null>(null);

  const fetchUserRoles = useCallback(async (userId: string) => {
    // Prevent redundant fetches for the same user
    if (rolesFetchedForUser.current === userId) return;
    rolesFetchedForUser.current = userId;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const roles = data?.map(r => r.role) || [];
      setState(prev => ({ ...prev, roles, loading: false }));
    } catch (error) {
      console.error('Error fetching user roles:', error);
      rolesFetchedForUser.current = null; // Allow retry on error
      setState(prev => ({ ...prev, roles: [], loading: false }));
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip when admin is creating a user on someone else's behalf
        const { suppressAuthListener } = await import('@/lib/adminAuth');
        if (suppressAuthListener) return;
        if (event === 'SIGNED_OUT') {
          rolesFetchedForUser.current = null;
          setState({
            session: null,
            user: null,
            roles: [],
            loading: false,
          });
        } else if (session?.user) {
          setState(prev => ({
            ...prev,
            session,
            user: session.user,
          }));
          // Defer role fetch to avoid Supabase deadlock
          setTimeout(() => fetchUserRoles(session.user.id), 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserRoles(session.user.id);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRoles]);

  const hasRole = (role: string) => state.roles.includes(role);
  
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user: state.user,
    session: state.session,
    roles: state.roles,
    hasRole,
    loading: state.loading,
    signOut,
  };
}
