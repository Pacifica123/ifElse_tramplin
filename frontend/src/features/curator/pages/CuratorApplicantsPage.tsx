import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/shared/api/errors';
import { getCuratorApplicants, updateCuratorApplicant, type CuratorApplicant } from '@/shared/api/curator';
import { CuratorStubNotice } from '../components/CuratorStubNotice';

function ApplicantCard({
  item,
  isSaving,
  onSave,
}: {
  item: CuratorApplicant;
  isSaving: boolean;
  onSave: (payload: Parameters<typeof updateCuratorApplicant>[1]) => void;
}) {
  const [draft, setDraft] = useState({
    fullName: item.fullName,
    university: item.university ?? '',
    studyCourse: item.studyCourse ?? '',
    graduationYear: item.graduationYear?.toString() ?? '',
    about: item.about ?? '',
    resumeText: item.resumeText ?? '',
  });

  return (
    <article style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 22, padding: 22, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>{item.fullName}</h2>
          <div style={{ color: '#667085', marginTop: 8 }}>{item.university ?? 'Вуз не указан'} · {item.studyCourse ?? 'Курс не указан'}</div>
        </div>
        <span className="btn btn--secondary" style={{ cursor: 'default' }}>Профиль #{item.id}</span>
      </div>

      <div>
        <strong>Навыки</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {item.skills.map((skill) => (
            <span key={skill} className="chip">{skill}</span>
          ))}
          {!item.skills.length ? <span>Навыки не заполнены</span> : null}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        <label className="field">
          <span>ФИО</span>
          <input
            value={draft.fullName}
            onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))}
            style={{ border: '1px solid #d9e0ea', borderRadius: 12, padding: '10px 12px' }}
          />
        </label>
        <label className="field">
          <span>Вуз</span>
          <input
            value={draft.university}
            onChange={(event) => setDraft((prev) => ({ ...prev, university: event.target.value }))}
            style={{ border: '1px solid #d9e0ea', borderRadius: 12, padding: '10px 12px' }}
          />
        </label>
        <label className="field">
          <span>Курс / программа</span>
          <input
            value={draft.studyCourse}
            onChange={(event) => setDraft((prev) => ({ ...prev, studyCourse: event.target.value }))}
            style={{ border: '1px solid #d9e0ea', borderRadius: 12, padding: '10px 12px' }}
          />
        </label>
        <label className="field">
          <span>Год выпуска</span>
          <input
            value={draft.graduationYear}
            onChange={(event) => setDraft((prev) => ({ ...prev, graduationYear: event.target.value }))}
            style={{ border: '1px solid #d9e0ea', borderRadius: 12, padding: '10px 12px' }}
          />
        </label>
      </div>

      <label className="field">
        <span>О соискателе</span>
        <textarea
          rows={3}
          value={draft.about}
          onChange={(event) => setDraft((prev) => ({ ...prev, about: event.target.value }))}
          style={{ border: '1px solid #d9e0ea', borderRadius: 16, padding: 14, resize: 'vertical' }}
        />
      </label>

      <label className="field">
        <span>Резюме</span>
        <textarea
          rows={4}
          value={draft.resumeText}
          onChange={(event) => setDraft((prev) => ({ ...prev, resumeText: event.target.value }))}
          style={{ border: '1px solid #d9e0ea', borderRadius: 16, padding: 14, resize: 'vertical' }}
        />
      </label>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap',justifyContent: 'center', textAlign: 'center'  }}>
        <button
          className="btn"
          type="button"
          disabled={isSaving}
          onClick={() =>
            onSave({
              fullName: draft.fullName.trim(),
              university: draft.university.trim() || null,
              studyCourse: draft.studyCourse.trim() || null,
              graduationYear: draft.graduationYear.trim() ? Number(draft.graduationYear) : null,
              about: draft.about.trim() || null,
              resumeText: draft.resumeText.trim() || null,
            })
          }
        >
          Сохранить изменения
        </button>
      </div>
    </article>
  );
}

export function CuratorApplicantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const applicantsQuery = useQuery({
    queryKey: ['curator-applicants'],
    queryFn: () => getCuratorApplicants(),
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
      const matchesSearch = !needle
        ? true
        : [item.fullName, item.university, item.studyCourse, item.skills.join(' ')]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle);
      return matchesSearch;
    });
  }, [applicantsQuery.data, search]);

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
          <h1 style={{ margin: 0, fontSize: 42 , textAlign:'center'}}>Профили соискателей</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center'  }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по имени, вузу, навыкам"
            style={{ minWidth: 320, border: '1px solid #d9e0ea', borderRadius: 14, padding: '12px 14px' }}
          />
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
