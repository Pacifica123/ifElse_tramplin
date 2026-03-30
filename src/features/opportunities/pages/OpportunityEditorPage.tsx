import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { paths } from '@/app/router/paths';
import { getErrorMessage } from '@/shared/api/errors';
import {
  createOpportunity,
  type EmploymentType,
  type Level,
  type OpportunityCreatePayload,
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
  addressId: '1',
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
    addressId: draft.workFormat === 'remote' ? null : Number(draft.addressId),
    salaryFrom: draft.salaryFrom.trim() ? Number(draft.salaryFrom) : null,
    salaryTo: draft.salaryTo.trim() ? Number(draft.salaryTo) : null,
    expiresAt:
      draft.opportunityType === 'event' ? null : toIsoOrNull(draft.expiresAt),
    eventDate:
      draft.opportunityType === 'event' ? toIsoOrNull(draft.eventDate) : null,
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
  const isEditMode = Boolean(id);
  const [draft, setDraft] = useState<EditorDraft>(initialDraft);

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const createMutation = useMutation({
    mutationFn: createOpportunity,
    onSuccess: (created) => {
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
    if (isEditMode) return;
    createMutation.mutate(buildPayload(draft));
  };

  if (isEditMode) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <h1>{pageTitle}</h1>
        <p>
          Backend уже умеет обновлять возможность через <code>PATCH /opportunities/{'{id}'}</code>,
          но отдельной ручки для загрузки своей полной карточки по id на фронт пока нет. Поэтому сейчас
          на фронте подключено только создание новой возможности.
        </p>
        <Link className="btn" to={paths.employerOpportunities}>
          Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>{pageTitle}</h1>
        <p style={{ color: '#667085' }}>
          Эта форма уже подключена к <code>POST /opportunities</code>. Важно: backend разрешит создание
          только верифицированному работодателю.
        </p>
      </section>

      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <label>
            <div>Заголовок</div>
            <input value={draft.title} onChange={(e) => updateField('title', e.target.value)} style={{ width: '100%', minHeight: 44 }} />
          </label>
          <label>
            <div>Тип</div>
            <select value={draft.opportunityType} onChange={(e) => updateField('opportunityType', e.target.value as OpportunityType)} style={{ width: '100%', minHeight: 44 }}>
              <option value="internship">Стажировка</option>
              <option value="vacancy">Вакансия</option>
              <option value="mentoring">Менторство</option>
              <option value="event">Мероприятие</option>
            </select>
          </label>
          <label>
            <div>Короткое описание</div>
            <textarea value={draft.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} style={{ width: '100%', minHeight: 90 }} />
          </label>
          <label>
            <div>Полное описание</div>
            <textarea value={draft.fullDescription} onChange={(e) => updateField('fullDescription', e.target.value)} style={{ width: '100%', minHeight: 90 }} />
          </label>
        </div>
      </section>

      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
          <label>
            <div>Формат</div>
            <select value={draft.workFormat} onChange={(e) => updateField('workFormat', e.target.value as WorkFormat)} style={{ width: '100%', minHeight: 44 }}>
              <option value="remote">Удалённо</option>
              <option value="office">Офис</option>
              <option value="hybrid">Гибрид</option>
            </select>
          </label>
          <label>
            <div>Тип занятости</div>
            <select value={draft.employmentType} onChange={(e) => updateField('employmentType', e.target.value as EmploymentType | '')} style={{ width: '100%', minHeight: 44 }}>
              <option value="">Не указывать</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="project">Project</option>
            </select>
          </label>
          <label>
            <div>Уровень</div>
            <select value={draft.level} onChange={(e) => updateField('level', e.target.value as Level | '')} style={{ width: '100%', minHeight: 44 }}>
              <option value="">Не указывать</option>
              <option value="intern">Intern</option>
              <option value="junior">Junior</option>
              <option value="middle">Middle</option>
              <option value="senior">Senior</option>
            </select>
          </label>
          <label>
            <div>{draft.workFormat === 'remote' ? 'City ID' : 'Address ID'}</div>
            <input
              value={draft.workFormat === 'remote' ? draft.cityId : draft.addressId}
              onChange={(e) =>
                draft.workFormat === 'remote'
                  ? updateField('cityId', e.target.value)
                  : updateField('addressId', e.target.value)
              }
              style={{ width: '100%', minHeight: 44 }}
            />
          </label>
          <label>
            <div>Зарплата от</div>
            <input value={draft.salaryFrom} onChange={(e) => updateField('salaryFrom', e.target.value)} style={{ width: '100%', minHeight: 44 }} />
          </label>
          <label>
            <div>Зарплата до</div>
            <input value={draft.salaryTo} onChange={(e) => updateField('salaryTo', e.target.value)} style={{ width: '100%', minHeight: 44 }} />
          </label>
          {draft.opportunityType === 'event' ? (
            <label>
              <div>Дата мероприятия</div>
              <input type="datetime-local" value={draft.eventDate} onChange={(e) => updateField('eventDate', e.target.value)} style={{ width: '100%', minHeight: 44 }} />
            </label>
          ) : (
            <label>
              <div>Срок действия</div>
              <input type="datetime-local" value={draft.expiresAt} onChange={(e) => updateField('expiresAt', e.target.value)} style={{ width: '100%', minHeight: 44 }} />
            </label>
          )}
        </div>

        <div style={{ color: '#667085' }}>
          Подсказка для текущих seed-данных backend: <strong>cityId=1</strong> — Tomsk, <strong>addressId=1</strong> — Tomsk, Lenina Ave, 30.
        </div>
      </section>

      <section style={{ background: '#fff', border: '1px solid #d9e0ea', borderRadius: 24, padding: 24, display: 'grid', gap: 16 }}>
        <h2 style={{ margin: 0 }}>Контакты и теги</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
          <label>
            <div>Email</div>
            <input value={draft.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} style={{ width: '100%', minHeight: 44 }} />
          </label>
          <label>
            <div>Телефон</div>
            <input value={draft.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} style={{ width: '100%', minHeight: 44 }} />
          </label>
          <label>
            <div>Telegram</div>
            <input value={draft.contactTelegram} onChange={(e) => updateField('contactTelegram', e.target.value)} style={{ width: '100%', minHeight: 44 }} />
          </label>
          <label>
            <div>Контактное лицо</div>
            <input value={draft.contactPerson} onChange={(e) => updateField('contactPerson', e.target.value)} style={{ width: '100%', minHeight: 44 }} />
          </label>
        </div>

        <div>
          <div style={{ marginBottom: 10 }}>Теги</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(tagsQuery.data ?? []).map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={draft.tagIds.includes(tag.id) ? 'btn' : 'btn btn--secondary'}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <label>
          <div>Дополнительные ссылки</div>
          <textarea value={draft.resourceLinksText} onChange={(e) => updateField('resourceLinksText', e.target.value)} style={{ width: '100%', minHeight: 90 }} placeholder={'По одной ссылке с новой строки'} />
        </label>

        <label>
          <div>Media URLs</div>
          <textarea value={draft.mediaText} onChange={(e) => updateField('mediaText', e.target.value)} style={{ width: '100%', minHeight: 90 }} placeholder={'По одной ссылке с новой строки'} />
        </label>
      </section>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Создаём…' : 'Создать возможность'}
        </button>
        <Link className="btn btn--secondary" to={paths.employerOpportunities}>
          К списку
        </Link>
      </div>

      {createMutation.isError ? (
        <p style={{ color: '#b42318', margin: 0 }}>{getErrorMessage(createMutation.error)}</p>
      ) : null}
    </form>
  );
}
