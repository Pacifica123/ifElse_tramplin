import { Link } from 'react-router-dom';
import { paths } from '@/app/router/paths';

export function PublicApplicantProfilePage() {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 28, display: 'grid', gap: 12 }}>
        <Link to={paths.home} style={{ color: '#2f6fed', textDecoration: 'none', fontWeight: 700 }}>
          ← Вернуться на главную
        </Link>
        <h1 style={{ margin: 0, fontSize: 44 }}>Публичный профиль соискателя</h1>
        <p style={{ margin: 0, color: '#667085', maxWidth: 760 }}>
          Эта страница пока не подключена, потому что в текущем backend-срезе нет публичного applicant endpoint
          для неавторизованных пользователей. Сейчас backend покрывает авторизацию, профили “/me”, каталог,
          employer flow, applications и curator/admin moderation.
        </p>
      </section>
    </div>
  );
}
