import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import { paths } from '@/app/router/paths';
import {
  getApplicantProfileById,
  getEmployerVisibleApplicantProfileById,
} from '@/shared/api/applicantProfile';
import { getContactCareerInterests } from '@/shared/api/contacts';
import { getErrorMessage } from '@/shared/api/errors';
import type { OpportunityType } from '@/shared/api/opportunities';

const typeLabels: Record<OpportunityType, string> = {
  internship: 'Стажировка',
  vacancy: 'Вакансия',
  mentoring: 'Менторство',
  event: 'Мероприятие',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU');
}

export function PublicApplicantProfilePage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['public-applicant-profile', id, user?.role],
    queryFn: async () => {
      if (!id) throw new Error('Не передан id профиля');
      if (user?.role === 'employer') {
        return getEmployerVisibleApplicantProfileById(id);
      }
      return getApplicantProfileById(id);
    },
    enabled: Boolean(id) && isAuthenticated,
  });

  const interestsQuery = useQuery({
    queryKey: ['contact-career-interests', id],
    queryFn: () => getContactCareerInterests(id ?? ''),
    enabled: Boolean(id) && isAuthenticated && user?.role !== 'employer' && profileQuery.data?.careerInterestsVisible === true,
    retry: false,
  });

  const visibilityLabel = useMemo(() => {
    switch (profileQuery.data?.visibilityScope) {
      case 'owner':
        return 'Владелец профиля';
      case 'contact':
        return 'Видимость для контактов';
      case 'all_authorized':
        return 'Открыт для всех авторизованных';
      case 'hidden':
        return 'Скрыт';
      default:
        return '—';
    }
  }, [profileQuery.data?.visibilityScope]);

  if (!id) {
    return <div>Не передан id профиля.</div>;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 28, display: 'grid', gap: 12 }}>
          <Link to={paths.home} style={{ color: '#2f6fed', textDecoration: 'none', fontWeight: 700 }}>
            ← Вернуться на главную
          </Link>
          <h1 style={{ margin: 0, fontSize: 44 }}>Профиль соискателя</h1>
          <p style={{ margin: 0, color: '#667085', maxWidth: 760 }}>
            Эта страница теперь подключена к backend, но endpoint доступен только авторизованным пользователям.
          </p>
          <Link className="btn" to={paths.login}>Войти</Link>
        </section>
      </div>
    );
  }

  if (profileQuery.isLoading) {
    return <div>Загружаем профиль соискателя…</div>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <div>Не удалось загрузить профиль: {getErrorMessage(profileQuery.error)}</div>;
  }

  const profile = profileQuery.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 28, display: 'grid', gap: 12 }}>
        <Link to={paths.home} style={{ color: '#2f6fed', textDecoration: 'none', fontWeight: 700 }}>
          ← Вернуться на главную
        </Link>
        <h1 style={{ margin: 0, fontSize: 44 }}>{profile.fullName || 'Профиль соискателя'}</h1>
        <p style={{ margin: 0, color: '#667085', maxWidth: 760 }}>
          Страница подключена к backend-ручке просмотра профиля соискателя с учётом правил приватности.
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 0.9fr)', gap: 20 }}>
        <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 18 }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Основная информация</h2>
            <p style={{ margin: 0, color: '#475467', whiteSpace: 'pre-wrap' }}>{profile.about || 'Описание не заполнено.'}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <div><strong>Вуз:</strong><br />{profile.university || '—'}</div>
            <div><strong>Курс / программа:</strong><br />{profile.studyCourse || '—'}</div>
            <div><strong>Год выпуска:</strong><br />{profile.graduationYear ?? '—'}</div>
            <div><strong>Видимость:</strong><br />{visibilityLabel}</div>
          </div>

          <div>
            <h3>Резюме</h3>
            <p style={{ margin: 0, color: '#475467', whiteSpace: 'pre-wrap' }}>{profile.resumeText || 'Резюме скрыто или не заполнено.'}</p>
          </div>

          <div>
            <h3>Портфолио</h3>
            {profile.portfolioLinks.length ? (
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {profile.portfolioLinks.map((link) => (
                  <li key={link}>
                    <a href={link} target="_blank" rel="noreferrer">{link}</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>Ссылки не указаны.</p>
            )}
          </div>

          <div>
            <h3>Навыки</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profile.skills.length ? profile.skills.map((skill) => <span key={skill} className="chip">{skill}</span>) : <span>Навыки не указаны.</span>}
            </div>
          </div>
        </article>

        <aside style={{ display: 'grid', gap: 20 }}>
          <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0 }}>Карьерные интересы</h2>
            {!profile.careerInterestsVisible ? (
              <p style={{ margin: 0, color: '#667085' }}>Владелец профиля скрыл карьерные интересы.</p>
            ) : interestsQuery.isLoading ? (
              <p style={{ margin: 0, color: '#667085' }}>Загружаем карьерные интересы…</p>
            ) : interestsQuery.isError ? (
              <p style={{ margin: 0, color: '#b42318' }}>{getErrorMessage(interestsQuery.error)}</p>
            ) : (interestsQuery.data?.length ?? 0) > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {(interestsQuery.data ?? []).map((item) => (
                  <div key={`${item.type}-${item.opportunityId}-${item.createdAt}`} style={{ border: '1px solid #d9e0ea', borderRadius: 18, padding: 14, display: 'grid', gap: 6 }}>
                    <strong>{item.opportunityTitle}</strong>
                    <div style={{ color: '#667085' }}>{item.employerName || 'Работодатель'} · {typeLabels[item.opportunityType]}</div>
                    <div style={{ color: '#667085' }}>{item.type === 'applied' ? 'Отклик' : 'Избранное'} · {formatDate(item.createdAt)}</div>
                    <Link to={paths.opportunity(item.opportunityId)} style={{ color: '#2f6fed', textDecoration: 'none', fontWeight: 700 }}>
                      Открыть возможность
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#667085' }}>Пока нет данных для отображения.</p>
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}
