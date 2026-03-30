import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import { applyToOpportunity } from '@/shared/api/applications';
import { cancelEventRegistration, getMyEventRegistrations, registerForEvent } from '@/shared/api/eventRegistrations';
import {
  addFavoriteEmployer,
  addFavoriteOpportunity,
  getFavoriteEmployers,
  getFavoriteOpportunities,
  removeFavoriteEmployer,
  removeFavoriteOpportunity,
} from '@/shared/api/favorites';
import { getPublicOpportunityById, type OpportunityType, type WorkFormat } from '@/shared/api/opportunities';
import { getTags } from '@/shared/api/tags';

const typeLabels: Record<OpportunityType, string> = {
  internship: 'Стажировка',
  vacancy: 'Вакансия',
  mentoring: 'Менторство',
  event: 'Мероприятие',
};

const formatLabels: Record<WorkFormat, string> = {
  office: 'Офис',
  hybrid: 'Гибрид',
  remote: 'Удалённо',
};

function formatSalary(from?: number | null, to?: number | null) {
  if (from == null && to == null) return 'Не указано';
  if (from != null && to != null) return `${from.toLocaleString('ru-RU')}–${to.toLocaleString('ru-RU')} ₽`;
  if (from != null) return `от ${from.toLocaleString('ru-RU')} ₽`;
  return `до ${to?.toLocaleString('ru-RU')} ₽`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU');
}

export function OpportunityPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const opportunityQuery = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => getPublicOpportunityById(id ?? ''),
    enabled: Boolean(id),
  });

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const favoriteOpportunitiesQuery = useQuery({
    queryKey: ['favorite-opportunities'],
    queryFn: getFavoriteOpportunities,
    enabled: isAuthenticated,
  });

  const favoriteEmployersQuery = useQuery({
    queryKey: ['favorite-employers'],
    queryFn: getFavoriteEmployers,
    enabled: isAuthenticated,
  });

  const eventRegistrationsQuery = useQuery({
    queryKey: ['my-event-registrations', 'opportunity-page'],
    queryFn: () => getMyEventRegistrations({ upcomingOnly: false }),
    enabled: isAuthenticated && user?.role === 'applicant',
  });

  const applyMutation = useMutation({
    mutationFn: () => applyToOpportunity(id!, { coverLetter: coverLetter.trim() || undefined }),
    onSuccess: () => {
      setSuccess('Отклик отправлен. Теперь его можно увидеть в разделе «Мои отклики».');
      setCoverLetter('');
    },
  });

  const registerForEventMutation = useMutation({
    mutationFn: () => registerForEvent(id!),
    onSuccess: () => {
      setSuccess('Запись на мероприятие сохранена.');
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations', 'opportunity-page'] });
    },
  });

  const cancelEventRegistrationMutation = useMutation({
    mutationFn: () => cancelEventRegistration(id!),
    onSuccess: () => {
      setSuccess('Запись на мероприятие отменена.');
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations', 'opportunity-page'] });
    },
  });

  const toggleOpportunityFavoriteMutation = useMutation({
    mutationFn: async (payload: { opportunityId: number; isFavorite: boolean }) => {
      if (payload.isFavorite) {
        await removeFavoriteOpportunity(payload.opportunityId);
        return;
      }
      await addFavoriteOpportunity(payload.opportunityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['public-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
    },
  });

  const toggleEmployerFavoriteMutation = useMutation({
    mutationFn: async (payload: { employerProfileId: number; isFavorite: boolean }) => {
      if (payload.isFavorite) {
        await removeFavoriteEmployer(payload.employerProfileId);
        return;
      }
      await addFavoriteEmployer(payload.employerProfileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-employers'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
    },
  });

  const tagsById = useMemo(() => new Map((tagsQuery.data ?? []).map((tag) => [tag.id, tag.name])), [tagsQuery.data]);

  if (!id) {
    return <div>Не передан id возможности.</div>;
  }

  if (opportunityQuery.isLoading) {
    return <div>Загружаем карточку…</div>;
  }

  if (opportunityQuery.isError || !opportunityQuery.data) {
    return <div>Не удалось загрузить карточку: {getErrorMessage(opportunityQuery.error)}</div>;
  }

  const item = opportunityQuery.data;
  const contactInfo = item.contactInfo ?? {};
  const canApply = isAuthenticated && user?.role === 'applicant' && item.opportunityType !== 'event';
  const canRegisterForEvent = isAuthenticated && user?.role === 'applicant' && item.opportunityType === 'event';
  const eventRegistrationIds = new Set((eventRegistrationsQuery.data?.items ?? []).map((entry) => entry.opportunity.id));
  const isRegisteredForEvent = eventRegistrationIds.has(item.id);
  const favoriteOpportunityIds = new Set((favoriteOpportunitiesQuery.data ?? []).map((entry) => entry.id));
  const favoriteEmployerIds = new Set((favoriteEmployersQuery.data ?? []).map((entry) => entry.id));
  const isOpportunityFavorite = favoriteOpportunityIds.has(item.id);
  const isEmployerFavorite = favoriteEmployerIds.has(item.employerProfileId);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section
        style={{
          background: '#fff',
          border: '1px solid #d9e0ea',
          borderRadius: 24,
          padding: 28,
          display: 'grid',
          gap: 14,
        }}
      >
        <Link to={paths.home} style={{ color: '#2f6fed', textDecoration: 'none', fontWeight: 700 }}>
          ← Вернуться к каталогу
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#667085', marginBottom: 8 }}>{item.employerName ?? 'Работодатель'}</div>
            <h1 style={{ margin: 0, fontSize: 44 }}>{item.title}</h1>
            <p style={{ color: '#667085', marginTop: 10, maxWidth: 780 }}>{item.shortDescription}</p>
          </div>

          <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
            <span className="btn btn--secondary" style={{ cursor: 'default' }}>
              {typeLabels[item.opportunityType]}
            </span>
            <span className="btn btn--secondary" style={{ cursor: 'default' }}>
              {formatLabels[item.workFormat]}
            </span>
            {isAuthenticated ? (
              <>
                <button
                  className="btn btn--secondary"
                  type="button"
                  disabled={toggleOpportunityFavoriteMutation.isPending}
                  onClick={() =>
                    toggleOpportunityFavoriteMutation.mutate({ opportunityId: item.id, isFavorite: isOpportunityFavorite })
                  }
                >
                  {isOpportunityFavorite ? 'Убрать возможность из избранного' : 'Добавить возможность в избранное'}
                </button>
                <button
                  className="btn btn--secondary"
                  type="button"
                  disabled={toggleEmployerFavoriteMutation.isPending}
                  onClick={() =>
                    toggleEmployerFavoriteMutation.mutate({ employerProfileId: item.employerProfileId, isFavorite: isEmployerFavorite })
                  }
                >
                  {isEmployerFavorite ? 'Убрать работодателя из избранного' : 'Добавить работодателя в избранное'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(300px, 0.9fr)', gap: 20 }}>
        <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 18 }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Описание</h2>
            <p style={{ marginBottom: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {item.fullDescription || 'Подробное описание пока отсутствует.'}
            </p>
          </div>

          <div>
            <h3>Теги</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {item.tagIds.length ? (
                item.tagIds.map((tagId) => (
                  <span key={tagId} className="chip">
                    {tagsById.get(tagId) ?? `Tag #${tagId}`}
                  </span>
                ))
              ) : (
                <span>Теги не указаны</span>
              )}
            </div>
          </div>

          <div>
            <h3>Полезные ссылки</h3>
            {item.resourceLinks.length ? (
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {item.resourceLinks.map((link) => (
                  <li key={link}>
                    <a href={link} target="_blank" rel="noreferrer">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>Ссылки не добавлены.</p>
            )}
          </div>
        </article>

        <aside style={{ display: 'grid', gap: 20 }}>
          <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}>
            <h2 style={{ marginTop: 0 }}>Параметры</h2>
            <div><strong>Зарплата:</strong> {formatSalary(item.salaryFrom, item.salaryTo)}</div>
            <div><strong>Публикация:</strong> {formatDate(item.publishedAt)}</div>
            <div><strong>Срок / дата:</strong> {formatDate(item.expiresAt ?? item.eventDate)}</div>
            <div><strong>Уровень:</strong> {item.level ?? '—'}</div>
            <div><strong>Тип занятости:</strong> {item.employmentType ?? '—'}</div>
            <div><strong>Локация:</strong> {item.addressText ?? item.cityName ?? 'Не указана'}</div>
            <div><strong>Статус:</strong> {item.publicationStatus}</div>
          </article>

          <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 10 }}>
            <h2 style={{ marginTop: 0 }}>Контакты</h2>
            <div><strong>Email:</strong> {String(contactInfo.email ?? '—')}</div>
            <div><strong>Телефон:</strong> {String(contactInfo.phone ?? '—')}</div>
            <div><strong>Telegram:</strong> {String(contactInfo.telegram ?? '—')}</div>
            <div><strong>Контактное лицо:</strong> {String(contactInfo.contactPerson ?? '—')}</div>
          </article>

          {canApply ? (
            <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 12 }}>
              <h2 style={{ margin: 0 }}>Откликнуться</h2>
              <p style={{ margin: 0, color: '#667085' }}>
                Эта кнопка подключена к <code>POST /opportunities/{'{id}'}/applications</code>.
              </p>
              <textarea
                rows={5}
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
                placeholder="Короткое сопроводительное письмо"
                style={{ border: '1px solid #d9e0ea', borderRadius: 16, padding: 14, resize: 'vertical' }}
              />
              <button className="btn" type="button" onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
                {applyMutation.isPending ? 'Отправляем…' : 'Откликнуться'}
              </button>
              {success ? <p style={{ color: '#027a48', margin: 0 }}>{success}</p> : null}
              {applyMutation.isError ? <p style={{ color: '#b42318', margin: 0 }}>{getErrorMessage(applyMutation.error)}</p> : null}
            </article>
          ) : null}

          {canRegisterForEvent ? (
            <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 12 }}>
              <h2 style={{ margin: 0 }}>Запись на мероприятие</h2>
              <p style={{ margin: 0, color: '#667085' }}>
                Эта кнопка подключена к <code>POST /opportunities/{'{id}'}/event-registration</code> и <code>DELETE /opportunities/{'{id}'}/event-registration</code>.
              </p>
              {isRegisteredForEvent ? (
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => cancelEventRegistrationMutation.mutate()}
                  disabled={cancelEventRegistrationMutation.isPending}
                >
                  {cancelEventRegistrationMutation.isPending ? 'Отписываем…' : 'Отменить запись'}
                </button>
              ) : (
                <button className="btn" type="button" onClick={() => registerForEventMutation.mutate()} disabled={registerForEventMutation.isPending}>
                  {registerForEventMutation.isPending ? 'Записываем…' : 'Записаться на мероприятие'}
                </button>
              )}
              {success ? <p style={{ color: '#027a48', margin: 0 }}>{success}</p> : null}
              {registerForEventMutation.isError ? <p style={{ color: '#b42318', margin: 0 }}>{getErrorMessage(registerForEventMutation.error)}</p> : null}
              {cancelEventRegistrationMutation.isError ? <p style={{ color: '#b42318', margin: 0 }}>{getErrorMessage(cancelEventRegistrationMutation.error)}</p> : null}
            </article>
          ) : null}

          {!isAuthenticated ? (
            <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
              Чтобы откликнуться и сохранять избранное, нужно войти в аккаунт.
            </article>
          ) : null}

          {toggleOpportunityFavoriteMutation.isError ? (
            <p style={{ color: '#b42318', margin: 0 }}>{getErrorMessage(toggleOpportunityFavoriteMutation.error)}</p>
          ) : null}
          {toggleEmployerFavoriteMutation.isError ? (
            <p style={{ color: '#b42318', margin: 0 }}>{getErrorMessage(toggleEmployerFavoriteMutation.error)}</p>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
