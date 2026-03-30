import { type CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import { CITY_OPTIONS, getCityNameById } from '@/shared/config/locations';
import {
  createOpportunity,
  getPublicOpportunityById,
  updateOpportunity,
  type EmploymentType,
  type Level,
  type OpportunityCreatePayload,
  type OpportunityDetails,
  type OpportunityType,
  type WorkFormat,
} from '@/shared/api/opportunities';
import { getTags } from '@/shared/api/tags';

interface EditorDraft {
  title: string;
  shortDescription: string;
  fullDescription: string;
  opportunityType: OpportunityType;
  workFormat: WorkFormat;
  employmentType: EmploymentType | '';
  level: Level | '';
  cityId: string;
  addressId: string;
  salaryFrom: string;
  salaryTo: string;
  expiresAt: string;
  eventDate: string;
  contactEmail: string;
  contactPhone: string;
  contactTelegram: string;
  contactPerson: string;
  resourceLinksText: string;
  mediaText: string;
  tagIds: number[];
}

const initialDraft: EditorDraft = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  opportunityType: 'internship',
  workFormat: 'remote',
  employmentType: 'part_time',
  level: 'intern',
  cityId: '1',
  addressId: '',
  salaryFrom: '',
  salaryTo: '',
  expiresAt: '',
  eventDate: '',
  contactEmail: '',
  contactPhone: '',
  contactTelegram: '',
  contactPerson: '',
  resourceLinksText: '',
  mediaText: '',
  tagIds: [],
};

const sectionStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid #d9e0ea',
  borderRadius: 24,
  padding: 24,
  display: 'grid',
  gap: 16,
};

const grid2Style: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
};

const grid4Style: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 16,
};

function toInputDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toIsoOrNull(value: string) {
  if (!value.trim()) return null;
  return new Date(value).toISOString();
}

function parseLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toDraft(item: OpportunityDetails): EditorDraft {
  const contactInfo = item.contactInfo ?? {};
  return {
    title: item.title,
    shortDescription: item.shortDescription ?? '',
    fullDescription: item.fullDescription ?? '',
    opportunityType: item.opportunityType,
    workFormat: item.workFormat,
    employmentType: item.employmentType ?? '',
    level: item.level ?? '',
    cityId: item.cityId?.toString() ?? '1',
    addressId: item.addressId?.toString() ?? '',
    salaryFrom: item.salaryFrom?.toString() ?? '',
    salaryTo: item.salaryTo?.toString() ?? '',
    expiresAt: toInputDateTime(item.expiresAt),
    eventDate: toInputDateTime(item.eventDate),
    contactEmail: String(contactInfo.email ?? ''),
    contactPhone: String(contactInfo.phone ?? ''),
    contactTelegram: String(contactInfo.telegram ?? ''),
    contactPerson: String(contactInfo.contactPerson ?? ''),
    resourceLinksText: item.resourceLinks.join('\n'),
    mediaText: item.media.join('\n'),
    tagIds: item.tagIds,
  };
}

function buildPayload(draft: EditorDraft): OpportunityCreatePayload {
  return {
    title: draft.title.trim(),
    shortDescription: draft.shortDescription.trim(),
    fullDescription: draft.fullDescription.trim(),
    opportunityType: draft.opportunityType,
    workFormat: draft.workFormat,
    employmentType: draft.employmentType || null,
    level: draft.level || null,
    cityId: draft.workFormat === 'remote' ? Number(draft.cityId) : null,
    addressId: draft.workFormat === 'remote' ? null : draft.addressId.trim() ? Number(draft.addressId) : null,
    salaryFrom: draft.salaryFrom.trim() ? Number(draft.salaryFrom) : null,
    salaryTo: draft.salaryTo.trim() ? Number(draft.salaryTo) : null,
    expiresAt: draft.opportunityType === 'event' ? null : toIsoOrNull(draft.expiresAt),
    eventDate: draft.opportunityType === 'event' ? toIsoOrNull(draft.eventDate) : null,
    tagIds: draft.tagIds,
    contactInfo: {
      email: draft.contactEmail.trim(),
      phone: draft.contactPhone.trim() || null,
      telegram: draft.contactTelegram.trim() || null,
      contactPerson: draft.contactPerson.trim() || null,
    },
    resourceLinks: parseLines(draft.resourceLinksText),
    media: parseLines(draft.mediaText),
  };
}

export function OpportunityEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);
  const [draft, setDraft] = useState<EditorDraft>(initialDraft);

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const detailsQuery = useQuery({
    queryKey: ['opportunity', 'editor', id],
    queryFn: () => getPublicOpportunityById(id ?? ''),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (detailsQuery.data) {
      setDraft(toDraft(detailsQuery.data));
    }
  }, [detailsQuery.data]);

  const createMutation = useMutation({
    mutationFn: createOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-opportunities'] });
      navigate(paths.employerOpportunities);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: OpportunityCreatePayload) => updateOpportunity(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
      navigate(paths.employerOpportunities);
    },
  });

  const pageTitle = useMemo(
    () => (isEditMode ? 'Редактирование возможности' : 'Создание возможности'),
    [isEditMode],
  );

  const updateField = <K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tagId: number) => {
    setDraft((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((idValue) => idValue !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload(draft);
    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }
    createMutation.mutate(payload);
  };

  if (isEditMode && detailsQuery.isLoading) {
    return <div>Загружаем карточку для редактирования…</div>;
  }

  if (isEditMode && detailsQuery.isError) {
    return <div>Не удалось загрузить карточку: {getErrorMessage(detailsQuery.error)}</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
      <section style={sectionStyle}>
        <h1 style={{ margin: 0, fontSize: 42 }}>{pageTitle}</h1>
        <p style={{ color: '#667085', margin: 0 }}>
          Заполните описание, формат, контакты и теги, чтобы опубликовать новую карточку возможности.
        </p>
      </section>

      <section style={sectionStyle}>
        <div style={grid2Style}>
          <label className="field">
            <span>Заголовок</span>
            <input value={draft.title} onChange={(e) => updateField('title', e.target.value)} />
          </label>

          <label className="field">
            <span>Тип</span>
            <select value={draft.opportunityType} onChange={(e) => updateField('opportunityType', e.target.value as OpportunityType)}>
              <option value="internship">Стажировка</option>
              <option value="vacancy">Вакансия</option>
              <option value="mentoring">Менторство</option>
              <option value="event">Мероприятие</option>
            </select>
          </label>

          <label className="field">
            <span>Короткое описание</span>
            <textarea value={draft.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} />
          </label>

          <label className="field">
            <span>Полное описание</span>
            <textarea value={draft.fullDescription} onChange={(e) => updateField('fullDescription', e.target.value)} />
          </label>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={grid4Style}>
          <label className="field">
            <span>Формат</span>
            <select value={draft.workFormat} onChange={(e) => updateField('workFormat', e.target.value as WorkFormat)}>
              <option value="remote">Удалённо</option>
              <option value="office">Офис</option>
              <option value="hybrid">Гибрид</option>
            </select>
          </label>

          <label className="field">
            <span>Тип занятости</span>
            <select value={draft.employmentType} onChange={(e) => updateField('employmentType', e.target.value as EmploymentType | '')}>
              <option value="">Не указывать</option>
              <option value="full_time">Полная занятость</option>
              <option value="part_time">Частичная занятость</option>
              <option value="project">Проектная работа</option>
            </select>
          </label>

          <label className="field">
            <span>Уровень</span>
            <select value={draft.level} onChange={(e) => updateField('level', e.target.value as Level | '')}>
              <option value="">Не указывать</option>
              <option value="intern">Intern</option>
              <option value="junior">Junior</option>
              <option value="middle">Middle</option>
              <option value="senior">Senior</option>
            </select>
          </label>

          {draft.workFormat === 'remote' ? (
            <label className="field">
              <span>Город</span>
              <select value={draft.cityId} onChange={(e) => updateField('cityId', e.target.value)}>
                {CITY_OPTIONS.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="field">
              <span>ID адреса</span>
              <input
                value={draft.addressId}
                onChange={(e) => updateField('addressId', e.target.value)}
                placeholder="Например, 1"
              />
            </label>
          )}

          <label className="field">
            <span>Зарплата от</span>
            <input value={draft.salaryFrom} onChange={(e) => updateField('salaryFrom', e.target.value)} />
          </label>

          <label className="field">
            <span>Зарплата до</span>
            <input value={draft.salaryTo} onChange={(e) => updateField('salaryTo', e.target.value)} />
          </label>

          {draft.opportunityType === 'event' ? (
            <label className="field">
              <span>Дата мероприятия</span>
              <input type="datetime-local" value={draft.eventDate} onChange={(e) => updateField('eventDate', e.target.value)} />
            </label>
          ) : (
            <label className="field">
              <span>Срок действия</span>
              <input type="datetime-local" value={draft.expiresAt} onChange={(e) => updateField('expiresAt', e.target.value)} />
            </label>
          )}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0 }}>Контакты и теги</h2>
        <div style={grid4Style}>
          <label className="field">
            <span>Email</span>
            <input value={draft.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} />
          </label>

          <label className="field">
            <span>Телефон</span>
            <input value={draft.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} />
          </label>

          <label className="field">
            <span>Telegram</span>
            <input value={draft.contactTelegram} onChange={(e) => updateField('contactTelegram', e.target.value)} />
          </label>

          <label className="field">
            <span>Контактное лицо</span>
            <input value={draft.contactPerson} onChange={(e) => updateField('contactPerson', e.target.value)} />
          </label>
        </div>

        <div>
          <div style={{ marginBottom: 10, color: '#334155', fontSize: 14, fontWeight: 600 }}>Теги</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(tagsQuery.data ?? []).map((tag) => {
              const active = draft.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    border: active ? 'none' : '1px solid #dbe3f0',
                    borderRadius: 16,
                    padding: '10px 14px',
                    background: active ? 'linear-gradient(135deg, #2f6fed, #4f46e5)' : '#eef3ff',
                    color: active ? '#fff' : '#2447d6',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        <label className="field">
          <span>Дополнительные ссылки</span>
          <textarea
            value={draft.resourceLinksText}
            onChange={(e) => updateField('resourceLinksText', e.target.value)}
            placeholder="По одной ссылке с новой строки"
          />
        </label>

        <label className="field">
          <span>Media URLs</span>
          <textarea
            value={draft.mediaText}
            onChange={(e) => updateField('mediaText', e.target.value)}
            placeholder="По одной ссылке с новой строки"
          />
        </label>
      </section>

      <section style={{ ...sectionStyle, gap: 12 }}>
        <div style={{ color: '#667085', fontSize: 14 }}>
          {draft.workFormat === 'remote'
            ? `Карточка будет привязана к городу: ${getCityNameById(draft.cityId)}.`
            : 'Для офисного и гибридного формата используется ID адреса из базы.'}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn" type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending
              ? isEditMode
                ? 'Сохраняем…'
                : 'Создаём…'
              : isEditMode
                ? 'Сохранить изменения'
                : 'Создать возможность'}
          </button>
          <Link className="btn btn--secondary" to={paths.employerOpportunities}>
            К списку
          </Link>
        </div>
      </section>

      {createMutation.isError ? <p style={{ color: '#b42318', margin: 0 }}>{getErrorMessage(createMutation.error)}</p> : null}
      {updateMutation.isError ? <p style={{ color: '#b42318', margin: 0 }}>{getErrorMessage(updateMutation.error)}</p> : null}
    </form>
  );
}
