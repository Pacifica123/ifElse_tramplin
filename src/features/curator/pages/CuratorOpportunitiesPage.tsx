import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import { getCuratorOpportunities, updateCuratorOpportunity, type CuratorOpportunity } from '@/shared/api/curator';
import { type OpportunityType, type PublicationStatus } from '@/shared/api/opportunities';
import { CuratorStubNotice } from '../components/CuratorStubNotice';

const typeLabels: Record<OpportunityType, string> = {
  internship: 'Стажировка',
  vacancy: 'Вакансия',
  mentoring: 'Менторство',
  event: 'Мероприятие',
};

const statusLabels: Record<PublicationStatus, string> = {
  draft: 'Черновик',
  pending_moderation: 'На модерации',
  active: 'Активна',
  planned: 'Запланирована',
  closed: 'Закрыта',
  rejected: 'Отклонена',
};

function OpportunityCard({
  item,
  isSaving,
  onSave,
}: {
  item: CuratorOpportunity;
  isSaving: boolean;
  onSave: (payload: Parameters<typeof updateCuratorOpportunity>[1]) => void;
}) {
  return (
    <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 22, padding: 22, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>{item.title}</h2>
          <div style={{ color: '#667085', marginTop: 8 }}>{item.employerName} · {item.addressText ?? item.cityName ?? 'Локация не указана'}</div>
        </div>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
          <span className="btn btn--secondary" style={{ cursor: 'default' }}>{typeLabels[item.opportunityType]}</span>
          <span className="btn btn--secondary" style={{ cursor: 'default' }}>{statusLabels[item.publicationStatus]}</span>
        </div>
      </div>

      <p style={{ margin: 0, color: '#475467' }}>{item.shortDescription}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <div><strong>Формат:</strong><br />{item.workFormat}</div>
        <div><strong>ID:</strong><br />{item.id}</div>
        <div><strong>Salary:</strong><br />{item.salaryFrom ?? '—'} / {item.salaryTo ?? '—'}</div>
        <div><strong>Теги:</strong><br />{item.tagIds.length ? item.tagIds.join(', ') : '—'}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center'  }}>
        <button className="btn" type="button" disabled={isSaving} onClick={() => onSave({ publicationStatus: 'active' })}>
          Опубликовать
        </button>
        <button className="btn btn--secondary" type="button" disabled={isSaving} onClick={() => onSave({ publicationStatus: 'pending_moderation' })}>
          Оставить на модерации
        </button>
        <button className="btn btn--secondary" type="button" disabled={isSaving} onClick={() => onSave({ publicationStatus: 'rejected' })}>
          Отклонить
        </button>
        <button className="btn btn--secondary" type="button" disabled={isSaving} onClick={() => onSave({ publicationStatus: 'closed' })}>
          Закрыть
        </button>
        <Link className="btn btn--secondary" to={paths.opportunity(item.id)}>
          Публичная карточка
        </Link>
      </div>
    </article>
  );
}

export function CuratorOpportunitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PublicationStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | OpportunityType>('all');

  const opportunitiesQuery = useQuery({
    queryKey: ['curator-opportunities'],
    queryFn: () => getCuratorOpportunities(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ opportunityId, payload }: { opportunityId: number; payload: Parameters<typeof updateCuratorOpportunity>[1] }) =>
      updateCuratorOpportunity(opportunityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curator-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['curator-dashboard'] });
    },
  });

  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (opportunitiesQuery.data ?? []).filter((item) => {
      const matchesStatus = statusFilter === 'all' ? true : item.publicationStatus === statusFilter;
      const matchesType = typeFilter === 'all' ? true : item.opportunityType === typeFilter;
      const matchesSearch = !needle
        ? true
        : [item.title, item.employerName, item.shortDescription, item.cityName, item.addressText]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [opportunitiesQuery.data, search, statusFilter, typeFilter]);

  if (opportunitiesQuery.isLoading) {
    return <div>Загружаем возможности…</div>;
  }

  if (opportunitiesQuery.isError) {
    return <div>Не удалось загрузить возможности: {getErrorMessage(opportunitiesQuery.error)}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 42, textAlign:'center' }}>Модерация возможностей</h1>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center'  }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию, работодателю, локации"
            style={{ minWidth: 380, border: '1px solid #d9e0ea', borderRadius: 14, padding: '12px 14px' }}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} style={{ border: '1px solid #d9e0ea', borderRadius: 14, padding: '12px 14px' }}>
            <option value="all">Все статусы</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} style={{ border: '1px solid #d9e0ea', borderRadius: 14, padding: '12px 14px' }}>
            <option value="all">Все типы</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </section>

      {!items.length ? (
        <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
          По текущему фильтру возможностей нет.
        </section>
      ) : null}

      {items.map((item) => (
        <OpportunityCard
          key={item.id}
          item={item}
          isSaving={updateMutation.isPending}
          onSave={(payload) => updateMutation.mutate({ opportunityId: item.id, payload })}
        />
      ))}

      {updateMutation.isError ? <p style={{ color: '#b42318' }}>{getErrorMessage(updateMutation.error)}</p> : null}
    </div>
  );
}
