import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/shared/api/errors';
import {
  getEmployerApplicationsForOpportunity,
  updateApplicationStatus,
  type ApplicationStatus,
} from '@/shared/api/applications';
import { getEmployerOpportunities } from '@/shared/api/opportunities';

const statusLabels: Record<ApplicationStatus, string> = {
  pending: 'На рассмотрении',
  accepted: 'Принят',
  rejected: 'Отклонён',
  reserve: 'В резерве',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU');
}

export function EmployerApplicationsPage() {
  const queryClient = useQueryClient();
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');

  const opportunitiesQuery = useQuery({
    queryKey: ['employer-opportunities', 'for-applications'],
    queryFn: () => getEmployerOpportunities(),
  });

  useEffect(() => {
    if (!selectedOpportunityId && opportunitiesQuery.data?.items?.length) {
      setSelectedOpportunityId(opportunitiesQuery.data.items[0].id);
    }
  }, [opportunitiesQuery.data?.items, selectedOpportunityId]);

  const applicationsQuery = useQuery({
    queryKey: ['employer-applications', selectedOpportunityId, statusFilter],
    queryFn: () =>
      getEmployerApplicationsForOpportunity(selectedOpportunityId!, {
        status: statusFilter || undefined,
      }),
    enabled: Boolean(selectedOpportunityId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: number; status: ApplicationStatus }) =>
      updateApplicationStatus(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-applications', selectedOpportunityId] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });

  const selectedOpportunity = useMemo(
    () => opportunitiesQuery.data?.items.find((item) => item.id === selectedOpportunityId) ?? null,
    [opportunitiesQuery.data?.items, selectedOpportunityId],
  );

  if (opportunitiesQuery.isLoading) {
    return <div>Загружаем возможности работодателя…</div>;
  }

  if (opportunitiesQuery.isError) {
    return <div>Не удалось загрузить возможности: {getErrorMessage(opportunitiesQuery.error)}</div>;
  }

  const opportunities = opportunitiesQuery.data?.items ?? [];
  const items = applicationsQuery.data?.items ?? [];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 42 }}>Отклики на мои возможности</h1>
          <p style={{ color: '#667085', marginTop: 10 }}>
            Страница подключена к <code>GET /employer/opportunities/{'{id}'}/applications</code> и
            <code> PATCH /applications/{'{id}'}/status</code>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={selectedOpportunityId ?? ''}
            onChange={(event) => setSelectedOpportunityId(event.target.value ? Number(event.target.value) : null)}
            style={{ minWidth: 320, border: '1px solid #d9e0ea', borderRadius: 14, padding: '12px 14px' }}
          >
            {!opportunities.length ? <option value="">Нет возможностей</option> : null}
            {opportunities.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id} · {item.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | '')}
            style={{ border: '1px solid #d9e0ea', borderRadius: 14, padding: '12px 14px' }}
          >
            <option value="">Все статусы</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {selectedOpportunity ? (
          <div style={{ color: '#667085' }}>
            Сейчас выбрана: <strong>{selectedOpportunity.title}</strong>
          </div>
        ) : null}
      </section>

      {!selectedOpportunityId ? (
        <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
          Сначала создайте или выберите возможность.
        </section>
      ) : null}

      {applicationsQuery.isLoading ? <div>Загружаем отклики…</div> : null}
      {applicationsQuery.isError ? <div>Не удалось загрузить отклики: {getErrorMessage(applicationsQuery.error)}</div> : null}

      {!applicationsQuery.isLoading && selectedOpportunityId && !items.length ? (
        <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
          По выбранной возможности откликов пока нет.
        </section>
      ) : null}

      {items.map((item) => (
        <article
          key={item.id}
          style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>{item.applicant.fullName}</h2>
              <div style={{ color: '#667085', marginTop: 8 }}>
                {item.applicant.university ?? 'Вуз не указан'} · {item.applicant.studyCourse ?? 'Курс не указан'}
              </div>
            </div>
            <span className="btn btn--secondary" style={{ cursor: 'default' }}>
              {statusLabels[item.status]}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            <div><strong>Профиль:</strong><br />#{item.applicantProfileId}</div>
            <div><strong>Выпуск:</strong><br />{item.applicant.graduationYear ?? '—'}</div>
            <div><strong>Создан:</strong><br />{formatDate(item.createdAt)}</div>
            <div><strong>Обновлён:</strong><br />{formatDate(item.updatedAt)}</div>
          </div>

          <div>
            <strong>О соискателе</strong>
            <p style={{ margin: '8px 0 0', color: '#475467', whiteSpace: 'pre-wrap' }}>
              {item.applicant.about || 'Описание не заполнено.'}
            </p>
          </div>

          <div>
            <strong>Сопроводительное письмо</strong>
            <p style={{ margin: '8px 0 0', color: '#475467', whiteSpace: 'pre-wrap' }}>
              {item.coverLetter || 'Не добавлено'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['accepted', 'reserve', 'rejected', 'pending'] as const).map((status) => (
              <button
                key={status}
                className={status === item.status ? 'btn' : 'btn btn--secondary'}
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ applicationId: item.id, status })}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </article>
      ))}

      {updateMutation.isError ? <p style={{ color: '#b42318' }}>{getErrorMessage(updateMutation.error)}</p> : null}
    </div>
  );
}
