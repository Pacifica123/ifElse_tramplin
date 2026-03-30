import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { useAuth } from '@/app/providers/AuthProvider';
import { getErrorMessage } from '@/shared/api/errors';
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

const STORAGE_KEY = 'trampolin.registeredEvents.v1';

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

  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<'all' | WorkFormat>('all');
  const [city, setCity] = useState('all');
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRegisteredIds(parsed.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      setRegisteredIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredIds));
  }, [registeredIds]);

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

  const cities = useMemo(() => {
    return ['all', ...Array.from(new Set(backendEvents.map((item) => item.city)))];
  }, [backendEvents]);

  const filtered = useMemo(() => {
    return backendEvents.filter((item) => {
      const matchesCity = city === 'all' || item.city === city;
      return matchesCity;
    });
  }, [backendEvents, city]);

  const isApplicant = user?.role === 'applicant';

  const subscribe = (eventId: string) => {
    setRegisteredIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]));
  };

  const unsubscribe = (eventId: string) => {
    setRegisteredIds((prev) => prev.filter((id) => id !== eventId));
  };

  if (opportunitiesQuery.isError) {
    return <div>Не удалось загрузить мероприятия: {getErrorMessage(opportunitiesQuery.error)}</div>;
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBadge}>Трамплин · мероприятия</div>
        <h1 className={styles.title}>Карьерные мероприятия</h1>
        <p className={styles.subtitle}>
          Эта страница теперь берёт события из backend-каталога возможностей с фильтром{' '}
          <code>opportunityType=event</code>.
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
          <div className={styles.summaryValue}>{filtered.length}</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Формат</div>
          <div className={styles.summaryText}>
            {format === 'all' ? 'Любой' : formatKind(format)}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Мои записи</div>
          <div className={styles.summaryText}>{registeredIds.length}</div>
        </div>
      </section>

      {opportunitiesQuery.isLoading ? <div className={styles.emptyState}>Загружаем мероприятия…</div> : null}

      <section className={styles.list}>
        {filtered.map((item) => {
          const isRegistered = registeredIds.includes(item.id);

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
                      onClick={() => unsubscribe(item.id)}
                    >
                      Отписаться
                    </button>
                  ) : (
                    <button className="btn" type="button" onClick={() => subscribe(item.id)}>
                      Записаться
                    </button>
                  )
                ) : (
                  <Link className="btn" to={paths.opportunity(item.id)}>
                    Подробнее
                  </Link>
                )}
              </div>
            </article>
          );
        })}

        {!opportunitiesQuery.isLoading && !filtered.length && (
          <div className={styles.emptyState}>По текущим фильтрам мероприятий не найдено.</div>
        )}
      </section>
    </div>
  );
}
