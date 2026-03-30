import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/shared/api/errors';
import {
  getCuratorVerificationRequests,
  reviewCuratorVerificationRequest,
  type CuratorVerificationRequest,
  type CuratorVerificationStatus,
} from '@/shared/api/curator';
import { CuratorStubNotice } from '../components/CuratorStubNotice';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU');
}

const statusLabels: Record<CuratorVerificationStatus, string> = {
  pending: 'На проверке',
  approved: 'Одобрен',
  rejected: 'Отклонён',
};

function VerificationCard({
  item,
  onReview,
  isPending,
}: {
  item: CuratorVerificationRequest;
  onReview: (status: CuratorVerificationStatus, comment: string) => void;
  isPending: boolean;
}) {
  const [comment, setComment] = useState(item.comment ?? '');

  return (
    <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 22, padding: 22, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>{item.companyName}</h2>
          <div style={{ color: '#667085', marginTop: 8 }}>Запрос #{item.id}</div>
        </div>
        <span className="btn btn--secondary" style={{ cursor: 'default' }}>{statusLabels[item.status]}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <div><strong>Подан:</strong><br />{formatDate(item.submittedAt)}</div>
        <div><strong>Рассмотрен:</strong><br />{formatDate(item.reviewedAt)}</div>
        <div><strong>Кем:</strong><br />{item.reviewedByName ?? '—'}</div>
      </div>

      <label className="field">
        <span>Комментарий к решению</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          style={{ border: '1px solid #d9e0ea', borderRadius: 16, padding: 14, resize: 'vertical' }}
        />
      </label>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" type="button" disabled={isPending} onClick={() => onReview('approved', comment)}>
          Одобрить
        </button>
        <button className="btn btn--secondary" type="button" disabled={isPending} onClick={() => onReview('rejected', comment)}>
          Отклонить
        </button>
        <button className="btn btn--secondary" type="button" disabled={isPending} onClick={() => onReview('pending', comment)}>
          Вернуть в очередь
        </button>
      </div>
    </article>
  );
}

export function CuratorVerificationPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | CuratorVerificationStatus>('all');

  const requestsQuery = useQuery({
    queryKey: ['curator-verification-requests'],
    queryFn: getCuratorVerificationRequests,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, status, comment }: { requestId: number; status: CuratorVerificationStatus; comment: string }) =>
      reviewCuratorVerificationRequest(requestId, { status, comment, reviewedByName: 'Куратор платформы' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curator-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['curator-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['curator-employers'] });
    },
  });

  const items = useMemo(() => {
    const source = requestsQuery.data ?? [];
    return source.filter((item) => (statusFilter === 'all' ? true : item.status === statusFilter));
  }, [requestsQuery.data, statusFilter]);

  if (requestsQuery.isLoading) {
    return <div>Загружаем очередь верификации…</div>;
  }

  if (requestsQuery.isError) {
    return <div>Не удалось загрузить очередь: {getErrorMessage(requestsQuery.error)}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 42 }}>Запросы на верификацию</h1>
          <p style={{ color: '#667085', marginTop: 10 }}>
            Здесь куратор принимает решение по работодателям. Пока это локальная очередь-заглушка.
          </p>
        </div>
        <CuratorStubNotice />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
          По текущему фильтру запросов нет.
        </section>
      ) : null}

      {items.map((item) => (
        <VerificationCard
          key={item.id}
          item={item}
          isPending={reviewMutation.isPending}
          onReview={(status, comment) => reviewMutation.mutate({ requestId: item.id, status, comment })}
        />
      ))}

      {reviewMutation.isError ? <p style={{ color: '#b42318' }}>{getErrorMessage(reviewMutation.error)}</p> : null}
    </div>
  );
}
