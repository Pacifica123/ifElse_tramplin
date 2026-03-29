import { Navigate } from 'react-router-dom';
import { paths } from '@/app/router/paths';

export function CuratorLoginPage() {
  return <Navigate to={paths.login} replace />;
}
