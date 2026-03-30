import { Link, Outlet } from 'react-router-dom';
import { paths } from '@/app/router/paths';

export function AdminLayout() {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Админка</h2>
        <Link to={paths.home}>На главную</Link>
        <Link to={paths.adminCurators}>Кураторы</Link>
      </aside>
      <section className="dashboard__content">
        <Outlet />
      </section>
    </div>
  );
}
