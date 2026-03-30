import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import { getCuratorDashboard } from '@/shared/api/curator';
import { CuratorStubNotice } from '../components/CuratorStubNotice';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #d9e0ea',
        borderRadius: 24,
        padding: 20,
        display: 'grid',
        gap: 6,
      }}
    >
      <span style={{ color: '#667085' }}>{label}</span>
      <strong style={{ fontSize: 40 }}>{value}</strong>
    </article>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU');
}

export function CuratorDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['curator-dashboard'],
    queryFn: getCuratorDashboard,
  });

  if (dashboardQuery.isLoading) {
    return <div>Загружаем дашборд…</div>;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <div>Не удалось загрузить дашборд: {getErrorMessage(dashboardQuery.error)}</div>;
  }

  const data = dashboardQuery.data;

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
          <h1 style={{ margin: 0, fontSize: 42, textAlign: 'center' }}>Панель куратора</h1>
        </div>
      </section>


      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16,justifyContent: 'center', textAlign: 'center'  }}>
        <StatCard label="Работодателей" value={data.employersTotal} />
        <StatCard label="Ожидают верификацию" value={data.verificationPending} />
        <StatCard label="Соискателей с неп. профилем" value={data.applicantsPending} />
        <StatCard label="Возможностей на модерации" value={data.opportunitiesPending} />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: 20 }}>
        <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex',  gap: 12, flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center'  }}>
            <div>
              <h2 style={{ margin: 0,  textAlign: 'center'  }}>Последние запросы на верификацию</h2>
            </div>
            <Link className="btn btn--secondary" to={paths.curatorVerification}>
              Открыть очередь
            </Link>
          </div>

          {data.latestVerificationRequests.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid #d9e0ea',
                borderRadius: 18,
                padding: 16,
                display: 'grid',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{item.companyName}</strong>
                <span className="chip">{item.status}</span>
              </div>
              <div style={{ color: '#667085' }}>Отправлен: {formatDate(item.submittedAt)}</div>
              <div>{item.comment || 'Комментарий не добавлен.'}</div>
            </div>
          ))}
        </article>

        <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Быстрые переходы</h2>
          <Link className="btn btn--secondary" to={paths.curatorEmployers}>Работодатели</Link>
          <Link className="btn btn--secondary" to={paths.curatorApplicants}>Соискатели</Link>
          <Link className="btn btn--secondary" to={paths.curatorOpportunities}>Возможности</Link>
          <div style={{ color: '#667085', lineHeight: 1.5, marginTop: 4 }}>
            Проверено: работодатели — {data.employersVerified}, отклонённых возможностей — {data.opportunitiesRejected}.
          </div>
        </article>
      </section>
    </div>
  );
}
