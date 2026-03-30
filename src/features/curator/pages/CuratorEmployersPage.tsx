import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/shared/api/errors';
import { getCuratorEmployers, updateCuratorEmployer, type CuratorEmployer } from '@/shared/api/curator';
import { CuratorStubNotice } from '../components/CuratorStubNotice';

const statusLabels: Record<CuratorEmployer['verificationStatus'], string> = {
  pending: 'На проверке',
  verified: 'Верифицирован',
  rejected: 'Отклонён',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU');
}

function EmployerCard({
  item,
  isSaving,
  onSave,
}: {
  item: CuratorEmployer;
  isSaving: boolean;
  onSave: (payload: { verificationStatus: CuratorEmployer['verificationStatus']; verificationComment: string; moderationNote: string }) => void;
}) {
  const [verificationComment, setVerificationComment] = useState(item.verificationComment ?? '');
  const [moderationNote, setModerationNote] = useState(item.moderationNote ?? '');

  return (
    <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 22, padding: 22, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>{item.companyName}</h2>
          <div style={{ color: '#667085', marginTop: 8 }}>{item.industry} · {item.city}</div>
        </div>
        <span className="btn btn--secondary" style={{ cursor: 'default' }}>{statusLabels[item.verificationStatus]}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <div><strong>Владелец:</strong><br />{item.ownerName}</div>
        <div><strong>E-mail:</strong><br />{item.ownerEmail}</div>
        <div><strong>Сайт:</strong><br />{item.websiteUrl || '—'}</div>
        <div><strong>Обновлено:</strong><br />{formatDate(item.updatedAt)}</div>
      </div>

      <label className="field">
        <span>Комментарий к верификации</span>
        <textarea
          rows={3}
          value={verificationComment}
          onChange={(event) => setVerificationComment(event.target.value)}
          style={{ border: '1px solid #d9e0ea', borderRadius: 16, padding: 14, resize: 'vertical' }}
        />
      </label>

      <label className="field">
        <span>Заметка куратора</span>
        <textarea
          rows={3}
          value={moderationNote}
          onChange={(event) => setModerationNote(event.target.value)}
          style={{ border: '1px solid #d9e0ea', borderRadius: 16, padding: 14, resize: 'vertical' }}
        />
      </label>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn"
          type="button"
          disabled={isSaving}
          onClick={() => onSave({ verificationStatus: 'verified', verificationComment, moderationNote })}
        >
          Подтвердить
        </button>
        <button
          className="btn btn--secondary"
          type="button"
          disabled={isSaving}
          onClick={() => onSave({ verificationStatus: 'pending', verificationComment, moderationNote })}
        >
          Вернуть на проверку
        </button>
        <button
          className="btn btn--secondary"
          type="button"
          disabled={isSaving}
          onClick={() => onSave({ verificationStatus: 'rejected', verificationComment, moderationNote })}
        >
          Отклонить
        </button>
      </div>
    </article>
  );
}

export function CuratorEmployersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CuratorEmployer['verificationStatus']>('all');

  const employersQuery = useQuery({
    queryKey: ['curator-employers'],
    queryFn: getCuratorEmployers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ employerId, payload }: { employerId: number; payload: Parameters<typeof updateCuratorEmployer>[1] }) =>
      updateCuratorEmployer(employerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curator-employers'] });
      queryClient.invalidateQueries({ queryKey: ['curator-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['curator-verification-requests'] });
    },
  });

  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (employersQuery.data ?? []).filter((item) => {
      const matchesStatus = statusFilter === 'all' ? true : item.verificationStatus === statusFilter;
      const matchesSearch = !needle
        ? true
        : [item.companyName, item.ownerName, item.ownerEmail, item.industry, item.city].join(' ').toLowerCase().includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [employersQuery.data, search, statusFilter]);

  if (employersQuery.isLoading) {
    return <div>Загружаем работодателей…</div>;
  }

  if (employersQuery.isError) {
    return <div>Не удалось загрузить работодателей: {getErrorMessage(employersQuery.error)}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 42 }}>Модерация работодателей</h1>
          <p style={{ color: '#667085', marginTop: 10 }}>
            Проверка карточек работодателей, комментариев и статуса верификации.
          </p>
        </div>
        <CuratorStubNotice />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по компании, владельцу, e-mail"
            style={{ minWidth: 320, border: '1px solid #d9e0ea', borderRadius: 14, padding: '12px 14px' }}
          />
          {(['all', 'pending', 'verified', 'rejected'] as const).map((status) => (
            <button
              key={status}
              className={statusFilter === status ? 'btn' : 'btn btn--secondary'}
              type="button"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'Все' : statusLabels[status]}
            </button>
          ))}
        </div>
      </section>

      {!items.length ? (
        <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
          По текущему фильтру работодателей нет.
        </section>
      ) : null}

      {items.map((item) => (
        <EmployerCard
          key={item.id}
          item={item}
          isSaving={updateMutation.isPending}
          onSave={(payload) => updateMutation.mutate({ employerId: item.id, payload })}
        />
      ))}

      {updateMutation.isError ? <p style={{ color: '#b42318' }}>{getErrorMessage(updateMutation.error)}</p> : null}
    </div>
  );
}
