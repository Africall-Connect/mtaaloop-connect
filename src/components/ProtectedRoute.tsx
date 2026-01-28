import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requireApproval?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requireApproval = false 
}: ProtectedRouteProps) {
  const { user, hasRole, loading } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<boolean | null>(null);
  const [checkingApproval, setCheckingApproval] = useState(requireApproval);

  const checkApprovalStatus = useCallback(async () => {
    if (!user) return;

    try {
      let approved = false;
      
      if (requiredRole === 'vendor') {
        const { data } = await supabase
          .from('vendor_profiles')
          .select('is_approved')
          .eq('user_id', user.id)
          .single();
        approved = data?.is_approved || false;
      } else if (requiredRole === 'estate_manager') {
        const { data } = await supabase
          .from('estates')
          .select('is_approved')
          .eq('manager_id', user.id)
          .single();
        approved = data?.is_approved || false;
      } else if (requiredRole === 'rider') {
        const { data } = await supabase
          .from('rider_profiles')
          .select('is_approved')
          .eq('user_id', user.id)
          .single();
        approved = data?.is_approved || false;
      }

      setApprovalStatus(approved);
    } catch (error) {
      console.error('Error checking approval status:', error);
      setApprovalStatus(false);
    } finally {
      setCheckingApproval(false);
    }
  }, [user, requiredRole]);

  useEffect(() => {
    if (requireApproval && user && requiredRole) {
      checkApprovalStatus();
    } else {
      setCheckingApproval(false);
    }
  }, [requireApproval, user, requiredRole, checkApprovalStatus]);

  if (loading || checkingApproval) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/home" replace />;
  }

  if (requireApproval && approvalStatus === false) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}
