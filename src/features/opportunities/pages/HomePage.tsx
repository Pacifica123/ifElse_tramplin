import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/router/paths';
import { PageStub } from '@/shared/ui/PageStub';
import { DgisMap } from '../components/DgisMap';
import { demoOpportunities } from '../data/demoOpportunities';

const typeLabels = {
  internship: 'Стажировка',
  vacancy: 'Вакансия',
  mentoring: 'Менторство',
  event: 'Мероприятие',
} as const;

const formatLabels = {
  office: 'Офис',
  hybrid: 'Гибрид',
  remote: 'Удалённо',
} as const;

export function HomePage() {
  const [activeId, setActiveId] = useState(demoOpportunities[0]?.id ?? '');

  const activeOpportunity = useMemo(
    () => demoOpportunities.find((item) => item.id === activeId) ?? demoOpportunities[0],
    [activeId],
  );

  return (
    <PageStub
      title="Главная"
      description="На главную встроена 2ГИС-карта. Пока данные тестовые: потом вместо них подключаются реальные возможности из backend API."
    >
      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="home-hero__eyebrow">Трамплин · карта возможностей</span>
          <h2>Вакансии, стажировки и карьерные события на одной карте</h2>
          <p>
            Для MVP карта уже встроена, а маркеры пока берутся из локальных тестовых данных. Дальше
            сюда подключается ваш публичный каталог возможностей.
          </p>
          <div className="home-hero__chips">
            <span>2ГИС MapGL</span>
            <span>Маркеры возможностей</span>
            <span>Тестовые данные без backend</span>
          </div>
        </div>

        <div className="home-hero__summary">
          <div className="home-summary-card">
            <span>Сейчас на карте</span>
            <strong>{demoOpportunities.length}</strong>
            <small>тестовые точки для интерфейса</small>
          </div>
          <div className="home-summary-card">
            <span>Активная карточка</span>
            <strong>{activeOpportunity.title}</strong>
            <small>{activeOpportunity.company}</small>
          </div>
        </div>
      </section>

      <section className="home-catalog">
        <aside className="home-catalog__sidebar">
          <div className="home-catalog__sidebar-header">
            <h3>Лента возможностей</h3>
            <p>Клик по карточке центрирует карту на точке.</p>
          </div>

          <div className="home-opportunity-list">
            {demoOpportunities.map((item) => {
              const isActive = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`home-opportunity-card ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveId(item.id)}
                >
                  <div className="home-opportunity-card__top">
                    <strong>{item.title}</strong>
                    <span>{typeLabels[item.type]}</span>
                  </div>
                  <div className="home-opportunity-card__meta">
                    <span>{item.company}</span>
                    <span>{formatLabels[item.format]}</span>
                  </div>
                  <p>{item.address}</p>
                  <div className="home-opportunity-card__bottom">
                    <code>{item.salary}</code>
                    <div className="home-opportunity-card__tags">
                      {item.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="home-catalog__map-panel">
          <div className="home-map__header">
            <div>
              <h3>2ГИС-карта</h3>
              <p>
                Встроена прямо на главную. Для продакшена просто замените тестовые данные на ответы
                API.
              </p>
            </div>
            <Link className="btn btn--secondary" to={paths.opportunity('demo-opportunity')}>
              Пример карточки
            </Link>
          </div>

          <div className="home-map__surface">
            <DgisMap opportunities={demoOpportunities} activeId={activeId} onPick={setActiveId} />
          </div>
        </div>
      </section>
    </PageStub>
  );
}
