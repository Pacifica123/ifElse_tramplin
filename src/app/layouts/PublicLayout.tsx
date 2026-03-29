import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { paths } from '@/app/router/paths';

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
          <Link to={paths.login}>Вход</Link>
          <Link to={paths.register}>Регистрация</Link>
        </nav>

        <div className="topbar__user">
          {user ? (
            <>
              <span>
                {user.displayName} · {user.role}
              </span>
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
