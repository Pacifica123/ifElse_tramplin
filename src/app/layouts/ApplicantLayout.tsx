import { Link, Outlet } from 'react-router-dom';
import { paths } from '@/app/router/paths';

export function ApplicantLayout() {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Кабинет соискателя</h2>
        <Link to={paths.applicantProfile}>Профиль</Link>
        <Link to={paths.applicantApplications}>Отклики</Link>
        <Link to={paths.applicantFavorites}>Избранное</Link>
        <Link to={paths.applicantContacts}>Контакты</Link>
        <Link to={paths.applicantPrivacy}>Приватность</Link>
      </aside>
      <section className="dashboard__content">
        <Outlet />
      </section>
    </div>
  );
}
