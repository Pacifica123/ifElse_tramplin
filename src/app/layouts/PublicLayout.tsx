import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { paths } from '@/app/router/paths';

function getProfilePath(role?: string) {
  switch (role) {
    case 'applicant':
      return paths.applicantProfile;
    case 'employer':
      return paths.employerProfile;
    case 'curator':
      return paths.curatorDashboard;
    case 'admin_curator':
      return paths.adminCurators;
    default:
      return paths.home;
  }
}

export function PublicLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to={paths.home}>
          Трамплин
        </Link>

        <nav className="nav">
          <Link to={paths.home}>Главная</Link>
          <Link to={paths.events}>Мероприятия</Link>
          {!user && <Link to={paths.login}>Вход</Link>}
        </nav>

        <div className="topbar__user">
          {user ? (
            <>
              <Link className="topbar__account" to={getProfilePath(user.role)}>
                {user.displayName || user.email} · {user.role}
              </Link>

              <button className="btn btn--secondary" onClick={logout} type="button">
                Выйти
              </button>
            </>
          ) : (
            <span>Гость</span>
          )}
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}