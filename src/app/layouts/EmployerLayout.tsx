import { Link, Outlet } from 'react-router-dom';
import { paths } from '@/app/router/paths';

export function EmployerLayout() {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Кабинет работодателя</h2>
        <Link to={paths.employerProfile}>Профиль</Link>
        <Link to={paths.employerOpportunities}>Мои возможности</Link>
        <Link to={paths.employerOpportunityNew}>Создать возможность</Link>
        <Link to={paths.employerApplications}>Отклики</Link>
      </aside>
      <section className="dashboard__content">
        <Outlet />
      </section>
    </div>
  );
}
