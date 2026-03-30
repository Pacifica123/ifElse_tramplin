import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { DgisMap } from '../components/DgisMap';
import type { DemoOpportunity } from '../data/demoOpportunities';
import {
  getPublicOpportunities,
  type OpportunitySummary,
  type OpportunityType,
  type WorkFormat,
} from '@/shared/api/opportunities';
import { getTags } from '@/shared/api/tags';
import { getErrorMessage } from '@/shared/api/errors';

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

function formatSalary(item: OpportunitySummary) {
  if (item.salaryFrom == null && item.salaryTo == null) {
    return item.opportunityType === 'event' ? 'мероприятие' : 'не указано';
  }

  if (item.salaryFrom != null && item.salaryTo != null) {
    return `${item.salaryFrom.toLocaleString('ru-RU')}–${item.salaryTo.toLocaleString('ru-RU')} ₽`;
  }

  if (item.salaryFrom != null) {
    return `от ${item.salaryFrom.toLocaleString('ru-RU')} ₽`;
  }

  return `до ${item.salaryTo?.toLocaleString('ru-RU')} ₽`;
}

function mapToDemoOpportunity(item: OpportunitySummary, tagsById: Map<number, string>): DemoOpportunity {
  return {
    id: String(item.id),
    title: item.title,
    company: item.employerName ?? 'Работодатель',
    city: item.cityName ?? 'Не указан',
    address: item.addressText ?? item.cityName ?? 'Локация не указана',
    type: item.opportunityType,
    format: item.workFormat,
    salary: formatSalary(item),
    tags: item.tagIds.map((tagId) => tagsById.get(tagId) ?? `Tag #${tagId}`),
    coordinates: [item.longitude ?? 84.9486, item.latitude ?? 56.4846],
  };
}

export function HomePage() {
  const [search, setSearch] = useState('');
  const [workFormat, setWorkFormat] = useState<WorkFormat | ''>('');
  const [opportunityType, setOpportunityType] = useState<OpportunityType | ''>('');
  const [selectedTagId, setSelectedTagId] = useState<number | ''>('');

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const opportunitiesQuery = useQuery({
    queryKey: ['public-opportunities', { search, workFormat, opportunityType, selectedTagId }],
    queryFn: () =>
      getPublicOpportunities({
        q: search || undefined,
        workFormat: workFormat || undefined,
        opportunityType: opportunityType || undefined,
        tagIds: typeof selectedTagId === 'number' ? [selectedTagId] : undefined,
      }),
  });

  const tagsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const tag of tagsQuery.data ?? []) {
      map.set(tag.id, tag.name);
    }
    return map;
  }, [tagsQuery.data]);

  const demoOpportunities = useMemo(
    () => (opportunitiesQuery.data?.items ?? []).map((item) => mapToDemoOpportunity(item, tagsById)),
    [opportunitiesQuery.data?.items, tagsById],
  );

  const [activeId, setActiveId] = useState<string>('');

  const activeOpportunity = useMemo(() => {
    if (!demoOpportunities.length) return null;
    return demoOpportunities.find((item) => item.id === activeId) ?? demoOpportunities[0];
  }, [activeId, demoOpportunities]);

  const activeBackendOpportunity = useMemo(() => {
    if (!activeOpportunity) return null;
    return opportunitiesQuery.data?.items.find((item) => String(item.id) === activeOpportunity.id) ?? null;
  }, [activeOpportunity, opportunitiesQuery.data?.items]);

  if (opportunitiesQuery.isError) {
    return <div>Не удалось загрузить каталог: {getErrorMessage(opportunitiesQuery.error)}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="home-hero__eyebrow">Трамплин · карта возможностей</span>
          <h2>Главная карта возможностей</h2>
          <p>
            Ищите вакансии, стажировки и мероприятия на карте и в ленте, используя фильтры по формату, типу и тегам.
          </p>
          <div className="home-hero__chips">
            <span>Публичный каталог</span>
            <span>Фильтры по формату и типу</span>
            <span>Фильтр по тегам</span>
          </div>
        </div>

        <div className="home-hero__summary">
          <div className="home-summary-card">
            <span>Сейчас в выдаче</span>
            <strong>{opportunitiesQuery.data?.total ?? 0}</strong>
            <small>актуальных возможностей</small>
          </div>
          <div className="home-summary-card">
            <span>Активная карточка</span>
            <strong>{activeOpportunity?.title ?? '—'}</strong>
            <small>{activeOpportunity?.company ?? 'Выберите карточку слева'}</small>
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
          background: '#fff',
          border: '1px solid #d9e0ea',
          borderRadius: 20,
          padding: 16,
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по названию и описанию"
          style={{ minHeight: 46, borderRadius: 12, border: '1px solid #d0d5dd', padding: '0 12px' }}
        />

        <select
          value={workFormat}
          onChange={(event) => setWorkFormat(event.target.value as WorkFormat | '')}
          style={{ minHeight: 46, borderRadius: 12, border: '1px solid #d0d5dd', padding: '0 12px' }}
        >
          <option value="">Любой формат</option>
          <option value="office">Офис</option>
          <option value="hybrid">Гибрид</option>
          <option value="remote">Удалённо</option>
        </select>

        <select
          value={opportunityType}
          onChange={(event) => setOpportunityType(event.target.value as OpportunityType | '')}
          style={{ minHeight: 46, borderRadius: 12, border: '1px solid #d0d5dd', padding: '0 12px' }}
        >
          <option value="">Любой тип</option>
          <option value="internship">Стажировка</option>
          <option value="vacancy">Вакансия</option>
          <option value="mentoring">Менторство</option>
          <option value="event">Мероприятие</option>
        </select>

        <select
          value={selectedTagId}
          onChange={(event) => setSelectedTagId(event.target.value ? Number(event.target.value) : '')}
          style={{ minHeight: 46, borderRadius: 12, border: '1px solid #d0d5dd', padding: '0 12px' }}
        >
          <option value="">Любой тег</option>
          {(tagsQuery.data ?? []).map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </section>

      <section className="home-catalog">
        <aside className="home-catalog__sidebar">
          <div className="home-catalog__sidebar-header">
            <h3>Лента возможностей</h3>
            <p>{opportunitiesQuery.isLoading ? 'Загружаем…' : 'Клик по карточке центрирует карту.'}</p>
          </div>

          <div className="home-opportunity-list">
            {(opportunitiesQuery.data?.items ?? []).map((item) => {
              const isActive = String(item.id) === activeOpportunity?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`home-opportunity-card ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveId(String(item.id))}
                >
                  <div className="home-opportunity-card__top">
                    <strong>{item.title}</strong>
                    <span>{typeLabels[item.opportunityType]}</span>
                  </div>
                  <div className="home-opportunity-card__meta">
                    <span>{item.employerName ?? 'Работодатель'}</span>
                    <span>{formatLabels[item.workFormat]}</span>
                  </div>
                  <p>{item.addressText ?? item.cityName ?? 'Локация не указана'}</p>
                  <div className="home-opportunity-card__bottom">
                    <code>{formatSalary(item)}</code>
                    <div className="home-opportunity-card__tags">
                      {item.tagIds.map((tagId) => (
                        <span key={tagId}>{tagsById.get(tagId) ?? `Tag #${tagId}`}</span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}

            {!opportunitiesQuery.isLoading && !(opportunitiesQuery.data?.items.length) ? (
              <div style={{ padding: 20, color: '#667085' }}>По выбранным фильтрам ничего не найдено.</div>
            ) : null}
          </div>
        </aside>

        <div className="home-catalog__map-panel">
          <div className="home-map__header">
            <div>
              <h3>2ГИС-карта</h3>
              <p>Выберите карточку слева, чтобы центрировать карту на нужной точке.</p>
            </div>
            {activeBackendOpportunity ? (
              <Link className="btn btn--secondary" to={paths.opportunity(activeBackendOpportunity.id)}>
                Открыть карточку
              </Link>
            ) : null}
          </div>

          <div className="home-map__surface">
            {demoOpportunities.length ? (
              <DgisMap
                opportunities={demoOpportunities}
                activeId={activeOpportunity?.id ?? demoOpportunities[0].id}
                onPick={setActiveId}
              />
            ) : (
              <div className="home-map__fallback">
                <strong>Нет точек для отображения</strong>
                <p>Backend вернул пустую выдачу по текущим фильтрам.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
