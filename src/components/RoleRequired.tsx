import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '@/contexts/AuthContext';

interface RoleRequiredProps {
  /** Allowed roles. If user.role is not in this list, they're redirected away. */
  roles: UserRole[];
  /** Where to send users who fail the role check (defaults to /dashboard). */
  fallback?: string;
}

/**
 * Route guard that combines auth + role checks.
 *
 *  - Unauthenticated → bounce to /auth/signin (preserving intended destination).
 *  - Authenticated but wrong role → bounce to `fallback` (default /dashboard).
 *  - Authenticated + allowed role → render the matched child route.
 *
 * Use this for /admin/* (ADMIN only) and /dashboard/data-upload + contributor
 * routes (CONTRIBUTOR or ADMIN). Everything else stays publicly browsable;
 * we gate per-action work via `useExportGuard`, not the route itself.
 */
export function RoleRequired({ roles, fallback = '/dashboard' }: RoleRequiredProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" state={{ from: location.pathname + location.search }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

export default RoleRequired;
