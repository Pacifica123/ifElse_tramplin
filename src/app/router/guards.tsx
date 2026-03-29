import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import type { UserRole } from '@/shared/types/common';
import { paths } from './paths';

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

interface RequireRoleProps {
  roles: UserRole[];
}

export function RequireRole({ roles }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={paths.home} replace />;
  }

  return <Outlet />;
}
