import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import { getCuratorApplicants, updateCuratorApplicant, type CuratorApplicant } from '@/shared/api/curator';
import { CuratorStubNotice } from '../components/CuratorStubNotice';

const statusLabels: Record<CuratorApplicant['moderationStatus'], string> = {
  pending: 'На проверке',
  approved: 'Подтверждён',
  rejected: 'Требует доработки',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU');
}

function ApplicantCard({
  item,
  isSaving,
  onSave,
}: {
  item: CuratorApplicant;
  isSaving: boolean;
  onSave: (payload: Parameters<typeof updateCuratorApplicant>[1]) => void;
}) {
  const [moderationNote, setModerationNote] = useState(item.moderationNote ?? '');

  return (
    <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 22, padding: 22, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>{item.fullName}</h2>
          <div style={{ color: '#667085', marginTop: 8 }}>{item.university} · {item.studyCourse}</div>
        </div>
        <span className="btn btn--secondary" style={{ cursor: 'default' }}>{statusLabels[item.moderationStatus]}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <div><strong>E-mail:</strong><br />{item.email}</div>
        <div><strong>Выпуск:</strong><br />{item.graduationYear}</div>
        <div><strong>Публичность:</strong><br />{item.isProfilePublic ? 'Открыт' : 'Скрыт'}</div>
        <div><strong>Обновлено:</strong><br />{formatDate(item.updatedAt)}</div>
      </div>

      <div>
        <strong>Навыки:</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {item.skills.map((skill) => (
            <span key={skill} className="chip">{skill}</span>
          ))}
        </div>
      </div>

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
        <button className="btn" type="button" disabled={isSaving} onClick={() => onSave({ moderationStatus: 'approved', moderationNote })}>
          Подтвердить
        </button>
        <button className="btn btn--secondary" type="button" disabled={isSaving} onClick={() => onSave({ moderationStatus: 'pending', moderationNote })}>
          Оставить на проверке
        </button>
        <button className="btn btn--secondary" type="button" disabled={isSaving} onClick={() => onSave({ moderationStatus: 'rejected', moderationNote })}>
          Нужна доработка
        </button>
        <button className="btn btn--secondary" type="button" disabled={isSaving} onClick={() => onSave({ isProfilePublic: !item.isProfilePublic, moderationNote })}>
          {item.isProfilePublic ? 'Скрыть профиль' : 'Открыть профиль'}
        </button>
        <Link className="btn btn--secondary" to={paths.publicApplicant(item.id)}>
          Публичная карточка
        </Link>
      </div>
    </article>
  );
}

export function CuratorApplicantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CuratorApplicant['moderationStatus']>('all');

  const applicantsQuery = useQuery({
    queryKey: ['curator-applicants'],
    queryFn: getCuratorApplicants,
  });

  const updateMutation = useMutation({
    mutationFn: ({ applicantId, payload }: { applicantId: number; payload: Parameters<typeof updateCuratorApplicant>[1] }) =>
      updateCuratorApplicant(applicantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curator-applicants'] });
      queryClient.invalidateQueries({ queryKey: ['curator-dashboard'] });
    },
  });

  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (applicantsQuery.data ?? []).filter((item) => {
      const matchesStatus = statusFilter === 'all' ? true : item.moderationStatus === statusFilter;
      const matchesSearch = !needle
        ? true
        : [item.fullName, item.email, item.university, item.skills.join(' ')].join(' ').toLowerCase().includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [applicantsQuery.data, search, statusFilter]);

  if (applicantsQuery.isLoading) {
    return <div>Загружаем соискателей…</div>;
  }

  if (applicantsQuery.isError) {
    return <div>Не удалось загрузить соискателей: {getErrorMessage(applicantsQuery.error)}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 42 }}>Модерация соискателей</h1>
          <p style={{ color: '#667085', marginTop: 10 }}>
            Куратор может проверить карточку соискателя, видимость профиля и оставить заметку.
          </p>
        </div>
        <CuratorStubNotice />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по имени, вузу, навыкам"
            style={{ minWidth: 320, border: '1px solid #d9e0ea', borderRadius: 14, padding: '12px 14px' }}
          />
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
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
          По текущему фильтру соискателей нет.
        </section>
      ) : null}

      {items.map((item) => (
        <ApplicantCard
          key={item.id}
          item={item}
          isSaving={updateMutation.isPending}
          onSave={(payload) => updateMutation.mutate({ applicantId: item.id, payload })}
        />
      ))}

      {updateMutation.isError ? <p style={{ color: '#b42318' }}>{getErrorMessage(updateMutation.error)}</p> : null}
    </div>
  );
}
