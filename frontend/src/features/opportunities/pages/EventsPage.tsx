import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { useAuth } from '@/app/providers/AuthProvider';
import { getErrorMessage } from '@/shared/api/errors';
import {
  cancelEventRegistration,
  getMyEventRegistrations,
  registerForEvent,
} from '@/shared/api/eventRegistrations';
import {
  getPublicOpportunities,
  type OpportunitySummary,
  type WorkFormat,
} from '@/shared/api/opportunities';
import { getTags } from '@/shared/api/tags';
import styles from '@/app/styles/EventsPage.module.css';

type EventItem = {
  id: string;
  title: string;
  company: string;
  format: WorkFormat;
  city: string;
  address: string;
  eventDate: string;
  shortDescription: string;
  tags: string[];
};

function formatKind(format: WorkFormat) {
  switch (format) {
    case 'office':
      return 'Офлайн';
    case 'hybrid':
      return 'Гибрид';
    case 'remote':
      return 'Онлайн';
    default:
      return format;
  }
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function mapOpportunityToEvent(item: OpportunitySummary, tagsById: Map<number, string>): EventItem {
  const eventLike = item as OpportunitySummary & { eventDate?: string | null; publishedAt?: string | null };

  return {
    id: String(item.id),
    title: item.title,
    company: item.employerName ?? 'Организатор',
    format: item.workFormat,
    city: item.cityName ?? 'Не указан',
    address: item.addressText ?? item.cityName ?? 'Локация не указана',
    eventDate: eventLike.eventDate ?? eventLike.publishedAt ?? new Date().toISOString(),
    shortDescription: item.shortDescription ?? 'Описание пока не добавлено.',
    tags: item.tagIds.map((tagId) => tagsById.get(tagId) ?? `Tag #${tagId}`),
  };
}

export function EventsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<'all' | WorkFormat>('all');
  const [city, setCity] = useState('all');

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const opportunitiesQuery = useQuery({
    queryKey: ['events-page', { query, format }],
    queryFn: () =>
      getPublicOpportunities({
        q: query.trim() || undefined,
        workFormat: format === 'all' ? undefined : format,
        opportunityType: 'event',
      }),
  });

  const registrationsQuery = useQuery({
    queryKey: ['my-event-registrations'],
    queryFn: () => getMyEventRegistrations({ upcomingOnly: false }),
    enabled: user?.role === 'applicant',
  });

  const registerMutation = useMutation({
    mutationFn: (opportunityId: string) => registerForEvent(opportunityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (opportunityId: string) => cancelEventRegistration(opportunityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
    },
  });

  const tagsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const tag of tagsQuery.data ?? []) {
      map.set(tag.id, tag.name);
    }
    return map;
  }, [tagsQuery.data]);

  const backendEvents = useMemo(
    () => (opportunitiesQuery.data?.items ?? []).map((item) => mapOpportunityToEvent(item, tagsById)),
    [opportunitiesQuery.data?.items, tagsById],
  );

  const registrationIds = useMemo(
    () => new Set((registrationsQuery.data?.items ?? []).map((item) => String(item.opportunity.id))),
    [registrationsQuery.data?.items],
  );

  const cities = useMemo(() => ['all', ...Array.from(new Set(backendEvents.map((item) => item.city)))], [backendEvents]);

  const filtered = useMemo(
    () => backendEvents.filter((item) => city === 'all' || item.city === city),
    [backendEvents, city],
  );

  const isApplicant = user?.role === 'applicant';

  if (opportunitiesQuery.isError) {
    return <div>Не удалось загрузить мероприятия: {getErrorMessage(opportunitiesQuery.error)}</div>;
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBadge}>Трамплин · мероприятия</div>
        <h1 className={styles.title}>Карьерные мероприятия</h1>
        <p className={styles.subtitle}>
          Подборка карьерных мероприятий с фильтрами по формату, городу и ключевым словам.
        </p>

        <div className={styles.filters}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, компании, городу или тегам"
          />

          <select
            className={styles.select}
            value={format}
            onChange={(e) => setFormat(e.target.value as 'all' | WorkFormat)}
          >
            <option value="all">Все форматы</option>
            <option value="office">Офлайн</option>
            <option value="hybrid">Гибрид</option>
            <option value="remote">Онлайн</option>
          </select>

          <select className={styles.select} value={city} onChange={(e) => setCity(e.target.value)}>
            {cities.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'Все города' : item}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Найдено событий</div>
          <div className={styles.summaryText}>{filtered.length}</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Формат</div>
          <div className={styles.summaryText}>{format === 'all' ? 'Любой' : formatKind(format)}</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Мои записи</div>
          <div className={styles.summaryText}>{registrationsQuery.data?.total ?? registrationIds.size}</div>
        </div>
      </section>

      {opportunitiesQuery.isLoading ? <div className={styles.emptyState}>Загружаем мероприятия…</div> : null}

      <section className={styles.list}>
        {filtered.map((item) => {
          const isRegistered = registrationIds.has(item.id);
          const isMutating =
            (registerMutation.isPending && registerMutation.variables === item.id) ||
            (cancelMutation.isPending && cancelMutation.variables === item.id);

          return (
            <article key={item.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardTitle}>{item.title}</div>
                  <div className={styles.cardCompany}>{item.company}</div>
                </div>

                <div className={styles.kindBadge}>{formatKind(item.format)}</div>
              </div>

              <div className={styles.meta}>
                <div>
                  <span className={styles.metaLabel}>Дата</span>
                  <strong>{formatDate(item.eventDate)}</strong>
                </div>

                <div>
                  <span className={styles.metaLabel}>Город</span>
                  <strong>{item.city}</strong>
                </div>

                <div>
                  <span className={styles.metaLabel}>Место</span>
                  <strong>{item.address}</strong>
                </div>
              </div>

              <p className={styles.description}>{item.shortDescription}</p>

              <div className={styles.tags}>
                {item.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className={styles.actions}>
                {!user ? (
                  <Link className="btn" to={paths.login}>
                    Войти, чтобы записаться
                  </Link>
                ) : isApplicant ? (
                  isRegistered ? (
                    <button
                      className="btn btn--secondary"
                      type="button"
                      onClick={() => cancelMutation.mutate(item.id)}
                      disabled={isMutating}
                    >
                      {isMutating ? 'Отписываем…' : 'Отписаться'}
                    </button>
                  ) : (
                    <button className="btn" type="button" onClick={() => registerMutation.mutate(item.id)} disabled={isMutating}>
                      {isMutating ? 'Записываем…' : 'Записаться'}
                    </button>
                  )
                ) : (
                  <span className="btn btn--secondary" style={{ cursor: 'default' }}>
                    Запись доступна соискателям
                  </span>
                )}

                <Link className="btn btn--secondary" to={paths.opportunity(item.id)}>
                  Открыть карточку
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {!opportunitiesQuery.isLoading && !filtered.length ? (
        <div className={styles.emptyState}>По выбранным параметрам мероприятий не найдено.</div>
      ) : null}

      {registerMutation.isError ? <div className={styles.emptyState}>{getErrorMessage(registerMutation.error)}</div> : null}
      {cancelMutation.isError ? <div className={styles.emptyState}>{getErrorMessage(cancelMutation.error)}</div> : null}
      {registrationsQuery.isError ? <div className={styles.emptyState}>{getErrorMessage(registrationsQuery.error)}</div> : null}
    </div>
  );
}
