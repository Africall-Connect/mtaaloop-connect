import { useEffect, useState } from 'react';
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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event, session?.user?.id);

        // Only clear user state on explicit sign out
        if (event === 'SIGNED_OUT') {
          setState(prev => ({
            ...prev,
            session: null,
            user: null,
            roles: [],
            loading: false,
          }));
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          // Update session but don't trigger role fetch again unnecessarily
          setState(prev => ({
            ...prev,
            session,
            user: session?.user ?? null,
          }));

          if (session?.user && !state.roles.length) {
            fetchUserRoles(session.user.id);
          }
        } else if (session?.user) {
          setState(prev => ({
            ...prev,
            session,
            user: session.user,
          }));

          if (!state.roles.length) {
            fetchUserRoles(session.user.id);
          }
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
  }, [state.roles.length]);

  const fetchUserRoles = async (userId: string) => {
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
      setState(prev => ({ ...prev, roles: [], loading: false }));
    }
  };

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
