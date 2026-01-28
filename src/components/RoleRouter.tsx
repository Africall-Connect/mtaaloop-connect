import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function RoleRouter() {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Admin gets priority
  if (roles.includes('admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Check for other roles
  if (roles.includes('vendor')) {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  if (roles.includes('estate_manager')) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (roles.includes('rider')) {
    return <Navigate to="/rider/dashboard" replace />;
  }

  // Default to customer home
  return <Navigate to="/home" replace />;
}
