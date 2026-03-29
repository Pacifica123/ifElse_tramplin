import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/router/paths';
import { useAuth } from '@/app/providers/AuthProvider';
import styles from '@/app/styles/EventsPage.module.css';

type EventItem = {
  id: string;
  title: string;
  company: string;
  format: 'office' | 'hybrid' | 'remote';
  city: string;
  address: string;
  eventDate: string;
  shortDescription: string;
  tags: string[];
};

const STORAGE_KEY = 'trampolin.registeredEvents.v1';

const demoEvents: EventItem[] = [
  {
    id: 'event-1',
    title: 'Карьерный день для студентов IT',
    company: 'Tech Consortium',
    format: 'office',
    city: 'Москва',
    address: 'Ленинские горы, 1',
    eventDate: '2026-04-18T12:00:00+07:00',
    shortDescription:
      'Открытые стенды компаний, быстрые собеседования, разбор резюме и карьерные консультации.',
    tags: ['Стажировки', 'Нетворкинг', 'HR'],
  },
  {
    id: 'event-2',
    title: 'Онлайн-митап по карьере в backend',
    company: 'CodeSpring',
    format: 'remote',
    city: 'Томск',
    address: 'Онлайн',
    eventDate: '2026-04-22T19:00:00+07:00',
    shortDescription:
      'Разговор о старте в backend-разработке, требованиях к junior-кандидатам и типичных ошибках.',
    tags: ['Backend', 'Rust', 'Junior'],
  },
  {
    id: 'event-3',
    title: 'День открытых дверей ML-команды',
    company: 'AI Track',
    format: 'hybrid',
    city: 'Новосибирск',
    address: 'Красный проспект, 25',
    eventDate: '2026-05-03T16:30:00+07:00',
    shortDescription:
      'Презентация команды, разбор pet-проектов и обсуждение стажировок в AI-направлении.',
    tags: ['ML', 'Python', 'CV'],
  },
  {
    id: 'event-4',
    title: 'Менторская встреча по подготовке к стажировкам',
    company: 'CodeInsight',
    format: 'office',
    city: 'Кемерово',
    address: 'пр. Советский, 60',
    eventDate: '2026-05-11T14:00:00+07:00',
    shortDescription:
      'Живой формат с менторами: как оформить профиль, резюме и что показать работодателю.',
    tags: ['Менторство', 'Резюме', 'Стажировки'],
  },
];

function formatKind(format: EventItem['format']) {
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

export function EventsPage() {
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<'all' | EventItem['format']>('all');
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

  const cities = useMemo(() => {
    return ['all', ...Array.from(new Set(demoEvents.map((item) => item.city)))];
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return demoEvents.filter((item) => {
      const matchesQuery =
        !needle ||
        [
          item.title,
          item.company,
          item.city,
          item.address,
          item.shortDescription,
          item.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle);

      const matchesFormat = format === 'all' || item.format === format;
      const matchesCity = city === 'all' || item.city === city;

      return matchesQuery && matchesFormat && matchesCity;
    });
  }, [city, format, query]);

  const isApplicant = user?.role === 'applicant';

  const subscribe = (eventId: string) => {
    setRegisteredIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]));
  };

  const unsubscribe = (eventId: string) => {
    setRegisteredIds((prev) => prev.filter((id) => id !== eventId));
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBadge}>Трамплин · мероприятия</div>
        <h1 className={styles.title}>Карьерные мероприятия</h1>
        <p className={styles.subtitle}>
          Отдельная витрина карьерных дней, митапов, встреч с менторами и событий компаний.
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
            onChange={(e) => setFormat(e.target.value as 'all' | EventItem['format'])}
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

        {!filtered.length && (
          <div className={styles.emptyState}>
            По текущим фильтрам мероприятий не найдено.
          </div>
        )}
      </section>
    </div>
  );
}