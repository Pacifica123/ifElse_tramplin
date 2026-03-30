import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import { getCuratorDashboard, resetCuratorWorkspace } from '@/shared/api/curator';
import { CuratorStubNotice } from '../components/CuratorStubNotice';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #d9e0ea',
        borderRadius: 22,
        padding: 20,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ color: '#667085' }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800 }}>{value}</div>
    </article>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU');
}

export function CuratorDashboardPage() {
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ['curator-dashboard'],
    queryFn: getCuratorDashboard,
  });

  const resetMutation = useMutation({
    mutationFn: resetCuratorWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curator-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['curator-employers'] });
      queryClient.invalidateQueries({ queryKey: ['curator-applicants'] });
      queryClient.invalidateQueries({ queryKey: ['curator-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['curator-verification-requests'] });
    },
  });

  if (dashboardQuery.isLoading) {
    return <div>Загружаем кураторский дашборд…</div>;
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
          <h1 style={{ margin: 0, fontSize: 42 }}>Панель куратора</h1>
          <p style={{ color: '#667085', marginTop: 10, maxWidth: 760 }}>
            Здесь собрана сводка по работодателям, соискателям, публикациям и очереди верификации.
          </p>
        </div>

        <button className="btn btn--secondary" type="button" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
          {resetMutation.isPending ? 'Сбрасываем…' : 'Сбросить демо-данные'}
        </button>
      </section>

      <CuratorStubNotice />

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
        <StatCard label="Работодателей" value={data.employersTotal} />
        <StatCard label="Ожидают верификацию" value={data.verificationPending} />
        <StatCard label="Соискателей на проверке" value={data.applicantsPending} />
        <StatCard label="Возможностей на модерации" value={data.opportunitiesPending} />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: 20 }}>
        <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>Последние запросы на верификацию</h2>
              <p style={{ color: '#667085', margin: '8px 0 0' }}>Быстрый обзор очереди работодателей.</p>
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
            Подходящая точка для куратора сейчас: пройти очередь верификации, затем проверить карточки работодателей и возможности на модерации.
          </div>
          <div style={{ fontSize: 14, color: '#667085' }}>
            Проверено: работодатели — {data.employersVerified}, отклонённых возможностей — {data.opportunitiesRejected}.
          </div>
        </article>
      </section>
    </div>
  );
}
