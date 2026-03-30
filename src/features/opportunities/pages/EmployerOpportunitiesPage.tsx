import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import {
  getEmployerOpportunities,
  updateOpportunityStatus,
  type OpportunityType,
  type PublicationStatus,
  type WorkFormat,
} from '@/shared/api/opportunities';

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

const statusLabels: Record<PublicationStatus, string> = {
  draft: 'Черновик',
  pending_moderation: 'На модерации',
  active: 'Активна',
  planned: 'Запланирована',
  closed: 'Закрыта',
  rejected: 'Отклонена',
};

function formatSalary(from?: number | null, to?: number | null) {
  if (from == null && to == null) return 'Не указано';
  if (from != null && to != null) return `${from.toLocaleString('ru-RU')}–${to.toLocaleString('ru-RU')} ₽`;
  if (from != null) return `от ${from.toLocaleString('ru-RU')} ₽`;
  return `до ${to?.toLocaleString('ru-RU')} ₽`;
}

export function EmployerOpportunitiesPage() {
  const queryClient = useQueryClient();

  const opportunitiesQuery = useQuery({
    queryKey: ['employer-opportunities'],
    queryFn: () => getEmployerOpportunities(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: PublicationStatus }) =>
      updateOpportunityStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-opportunities'] });
    },
  });

  if (opportunitiesQuery.isLoading) {
    return <div>Загружаем возможности работодателя…</div>;
  }

  if (opportunitiesQuery.isError) {
    return <div>Не удалось загрузить список: {getErrorMessage(opportunitiesQuery.error)}</div>;
  }

  const opportunities = opportunitiesQuery.data?.items ?? [];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section
        style={{
          background: '#fff',
          border: '1px solid #d9e0ea',
          borderRadius: 24,
          padding: 24,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 42 }}>Мои возможности</h1>
        </div>

        <Link className="btn" to={paths.employerOpportunityNew}>
          Создать возможность
        </Link>
      </section>

      {!opportunities.length ? (
        <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
          Пока нет созданных возможностей.
        </section>
      ) : null}

      {opportunities.map((item) => (
        <article
          key={item.id}
          style={{
            background: '#fff',
            border: '1px solid #d9e0ea',
            borderRadius: 24,
            padding: 24,
            display: 'grid',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#667085', marginBottom: 8 }}>{statusLabels[item.publicationStatus]}</div>
              <h2 style={{ margin: 0 }}>{item.title}</h2>
              <p style={{ margin: '10px 0 0', color: '#667085' }}>{item.shortDescription}</p>
            </div>

            <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
              <span className="btn btn--secondary" style={{ cursor: 'default' }}>
                {typeLabels[item.opportunityType]}
              </span>
              <span className="btn btn--secondary" style={{ cursor: 'default' }}>
                {formatLabels[item.workFormat]}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            <div><strong>Локация:</strong><br />{item.addressText ?? item.cityName ?? 'Не указана'}</div>
            <div><strong>Зарплата:</strong><br />{formatSalary(item.salaryFrom, item.salaryTo)}</div>
            <div><strong>ID:</strong><br />{item.id}</div>
            <div><strong>Теги:</strong><br />{item.tagIds.length ? item.tagIds.join(', ') : '—'}</div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btn--secondary" to={paths.opportunity(item.id)}>
              Открыть публичную карточку
            </Link>

            {item.publicationStatus !== 'active' ? (
              <button
                className="btn"
                type="button"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: item.id, status: 'active' })}
              >
                Сделать активной
              </button>
            ) : null}

            {item.publicationStatus !== 'closed' ? (
              <button
                className="btn btn--secondary"
                type="button"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: item.id, status: 'closed' })}
              >
                Закрыть
              </button>
            ) : null}
          </div>
        </article>
      ))}

      {statusMutation.isError ? (
        <p style={{ color: '#b42318' }}>{getErrorMessage(statusMutation.error)}</p>
      ) : null}
    </div>
  );
}
