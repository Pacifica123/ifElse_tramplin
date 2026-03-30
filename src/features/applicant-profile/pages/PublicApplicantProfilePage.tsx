import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import { getCuratorApplicants } from '@/shared/api/curator';

export function PublicApplicantProfilePage() {
  const { id } = useParams();

  const applicantsQuery = useQuery({
    queryKey: ['curator-applicants', 'public-preview'],
    queryFn: getCuratorApplicants,
  });

  const item = useMemo(() => {
    if (!id) return null;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return null;
    return (applicantsQuery.data ?? []).find((candidate) => candidate.id === numericId) ?? null;
  }, [applicantsQuery.data, id]);

  if (!id) {
    return <div>Не передан id профиля.</div>;
  }

  if (applicantsQuery.isLoading) {
    return <div>Загружаем публичный профиль…</div>;
  }

  if (applicantsQuery.isError) {
    return <div>Не удалось загрузить профиль: {getErrorMessage(applicantsQuery.error)}</div>;
  }

  if (!item) {
    return <div>Публичный профиль пользователя с id {id} не найден.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 28, display: 'grid', gap: 12 }}>
        <Link to={paths.home} style={{ color: '#2f6fed', textDecoration: 'none', fontWeight: 700 }}>
          ← Вернуться на главную
        </Link>
        <div style={{ color: '#667085' }}>{item.university}</div>
        <h1 style={{ margin: 0, fontSize: 44 }}>{item.fullName}</h1>
        <p style={{ margin: 0, color: '#667085' }}>
          {item.studyCourse}, выпуск {item.graduationYear} · {item.isProfilePublic ? 'Профиль открыт' : 'Профиль ограничен'}
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, 0.8fr)', gap: 20 }}>
        <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 16 }}>
          <h2 style={{ margin: 0 }}>Навыки</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {item.skills.map((skill) => (
              <span key={skill} className="chip">{skill}</span>
            ))}
          </div>
          <p style={{ color: '#667085', margin: 0 }}>
            Это публичный превью-профиль на основе фронтовых заглушек. Когда на бэке появится публичный applicant API, страница будет переключена на него.
          </p>
        </article>

        <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Контакты</h2>
          <div><strong>Email:</strong> {item.email}</div>
          <div><strong>Статус модерации:</strong> {item.moderationStatus}</div>
          <div><strong>ID профиля:</strong> {item.id}</div>
        </article>
      </section>
    </div>
  );
}
