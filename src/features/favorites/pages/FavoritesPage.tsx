import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import {
  getFavoriteEmployers,
  getFavoriteOpportunities,
  removeFavoriteEmployer,
  removeFavoriteOpportunity,
} from '@/shared/api/favorites';
import type { EmployerProfile } from '@/shared/api/employerProfile';
import type { OpportunitySummary, OpportunityType, WorkFormat } from '@/shared/api/opportunities';
import { getCityNameById } from '@/shared/config/locations';

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

function EmployerCard({
  item,
  onRemove,
  isPending,
}: {
  item: EmployerProfile;
  onRemove: () => void;
  isPending: boolean;
}) {
  return (
    <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>{item.companyName}</h2>
          <div style={{ color: '#667085', marginTop: 8 }}>{item.industry || 'Сфера не указана'}</div>
        </div>
        <span className="btn btn--secondary" style={{ cursor: 'default' }}>
          {item.verificationStatus}
        </span>
      </div>

      <div style={{ color: '#475467' }}>{item.shortDescription || 'Описание компании пока не заполнено.'}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <div><strong>Город:</strong><br />{getCityNameById(item.cityId)}</div>
        <div><strong>Сайт:</strong><br />{item.websiteUrl || '—'}</div>
        <div><strong>Видео:</strong><br />{item.promoVideoUrl || '—'}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn--secondary" type="button" onClick={onRemove} disabled={isPending}>
          {isPending ? 'Удаляем…' : 'Убрать из избранного'}
        </button>
      </div>
    </article>
  );
}

function OpportunityCard({
  item,
  onRemove,
  isPending,
}: {
  item: OpportunitySummary;
  onRemove: () => void;
  isPending: boolean;
}) {
  return (
    <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>{item.title}</h2>
          <div style={{ color: '#667085', marginTop: 8 }}>{item.employerName || 'Работодатель'}</div>
        </div>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
          <span className="btn btn--secondary" style={{ cursor: 'default' }}>{typeLabels[item.opportunityType]}</span>
          <span className="btn btn--secondary" style={{ cursor: 'default' }}>{formatLabels[item.workFormat]}</span>
        </div>
      </div>

      <div style={{ color: '#475467' }}>{item.shortDescription || 'Краткое описание пока не заполнено.'}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <div><strong>Локация:</strong><br />{item.addressText ?? item.cityName ?? 'Не указана'}</div>
        <div><strong>Зарплата:</strong><br />{formatSalary(item)}</div>
        <div><strong>ID:</strong><br />#{item.id}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link className="btn" to={paths.opportunity(item.id)}>
          Открыть карточку
        </Link>
        <button className="btn btn--secondary" type="button" onClick={onRemove} disabled={isPending}>
          {isPending ? 'Удаляем…' : 'Убрать из избранного'}
        </button>
      </div>
    </article>
  );
}

export function FavoritesPage() {
  const queryClient = useQueryClient();

  const opportunitiesQuery = useQuery({
    queryKey: ['favorite-opportunities'],
    queryFn: getFavoriteOpportunities,
  });

  const employersQuery = useQuery({
    queryKey: ['favorite-employers'],
    queryFn: getFavoriteEmployers,
  });

  const removeOpportunityMutation = useMutation({
    mutationFn: removeFavoriteOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['public-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity'] });
    },
  });

  const removeEmployerMutation = useMutation({
    mutationFn: removeFavoriteEmployer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-employers'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity'] });
    },
  });

  if (opportunitiesQuery.isLoading || employersQuery.isLoading) {
    return <div>Загружаем избранное…</div>;
  }

  if (opportunitiesQuery.isError) {
    return <div>Не удалось загрузить избранные возможности: {getErrorMessage(opportunitiesQuery.error)}</div>;
  }

  if (employersQuery.isError) {
    return <div>Не удалось загрузить избранных работодателей: {getErrorMessage(employersQuery.error)}</div>;
  }

  const opportunities = opportunitiesQuery.data ?? [];
  const employers = employersQuery.data ?? [];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 42, textAlign:'center' }}>Избранное</h1>
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Избранные возможности</h2>
          <span style={{ color: '#667085' }}>{opportunities.length} шт.</span>
        </div>

        {!opportunities.length ? (
          <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
            Пока нет избранных возможностей.
          </section>
        ) : null}

        {opportunities.map((item) => (
          <OpportunityCard
            key={item.id}
            item={item}
            isPending={removeOpportunityMutation.isPending}
            onRemove={() => removeOpportunityMutation.mutate(item.id)}
          />
        ))}
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Избранные работодатели</h2>
          <span style={{ color: '#667085' }}>{employers.length} шт.</span>
        </div>

        {!employers.length ? (
          <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
            Пока нет избранных работодателей.
          </section>
        ) : null}

        {employers.map((item) => (
          <EmployerCard
            key={item.id}
            item={item}
            isPending={removeEmployerMutation.isPending}
            onRemove={() => removeEmployerMutation.mutate(item.id)}
          />
        ))}
      </section>

      {removeOpportunityMutation.isError ? (
        <p style={{ color: '#b42318' }}>{getErrorMessage(removeOpportunityMutation.error)}</p>
      ) : null}
      {removeEmployerMutation.isError ? (
        <p style={{ color: '#b42318' }}>{getErrorMessage(removeEmployerMutation.error)}</p>
      ) : null}
    </div>
  );
}
