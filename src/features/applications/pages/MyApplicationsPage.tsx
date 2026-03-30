import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import { getMyApplications, type ApplicationStatus } from '@/shared/api/applications';

const statusLabels: Record<ApplicationStatus, string> = {
  pending: 'На рассмотрении',
  accepted: 'Принят',
  rejected: 'Отклонён',
  reserve: 'В резерве',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU');
}

export function MyApplicationsPage() {
  const applicationsQuery = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => getMyApplications(),
  });

  if (applicationsQuery.isLoading) {
    return <div>Загружаем мои отклики…</div>;
  }

  if (applicationsQuery.isError) {
    return <div>Не удалось загрузить отклики: {getErrorMessage(applicationsQuery.error)}</div>;
  }

  const items = applicationsQuery.data?.items ?? [];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 42 }}>Мои отклики</h1>
        <p style={{ color: '#667085', marginTop: 10 }}>
          Страница подключена к <code>GET /applications/me</code>. Пока backend отдаёт только сами отклики,
          поэтому на фронте показываются статус, id возможности и сопроводительное письмо.
        </p>
      </section>

      {!items.length ? (
        <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
          У вас пока нет откликов.
        </section>
      ) : null}

      {items.map((item) => (
        <article
          key={item.id}
          style={{
            background: '#fff',
            border: '1px solid #d9e0ea',
            borderRadius: 24,
            padding: 24,
            display: 'grid',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>Отклик #{item.id}</h2>
              <div style={{ color: '#667085', marginTop: 8 }}>Возможность #{item.opportunityId}</div>
            </div>
            <span className="btn btn--secondary" style={{ cursor: 'default' }}>
              {statusLabels[item.status]}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <div><strong>Создан:</strong><br />{formatDate(item.createdAt)}</div>
            <div><strong>Обновлён:</strong><br />{formatDate(item.updatedAt)}</div>
            <div><strong>Профиль соискателя:</strong><br />#{item.applicantProfileId}</div>
          </div>

          <div>
            <strong>Сопроводительное письмо</strong>
            <p style={{ margin: '8px 0 0', color: '#475467', whiteSpace: 'pre-wrap' }}>
              {item.coverLetter || 'Не добавлено'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn" to={paths.opportunity(item.opportunityId)}>
              Открыть карточку возможности
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
