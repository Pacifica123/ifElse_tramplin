import { Link, Outlet } from 'react-router-dom';
import { paths } from '@/app/router/paths';

export function CuratorLayout() {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Кураторская зона</h2>
        <Link to={paths.curatorDashboard}>Дашборд</Link>
        <Link to={paths.curatorEmployers}>Работодатели</Link>
        <Link to={paths.curatorApplicants}>Соискатели</Link>
        <Link to={paths.curatorOpportunities}>Возможности</Link>
        <Link to={paths.curatorVerification}>Верификация</Link>
      </aside>
      <section className="dashboard__content">
        <Outlet />
      </section>
    </div>
  );
}
