import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  getApplicantProfileMe,
  updateApplicantProfileMe,
  type ApplicantProfile,
  type ApplicantProfileUpdatePayload,
} from '@/shared/api/applicantProfile';
import { getErrorMessage } from '@/shared/api/errors';

interface ApplicantProfileDraft {
  fullName: string;
  university: string;
  studyCourse: string;
  graduationYear: string;
  about: string;
  resumeText: string;
  portfolioLinksText: string;
}

const emptyDraft: ApplicantProfileDraft = {
  fullName: '',
  university: '',
  studyCourse: '',
  graduationYear: '',
  about: '',
  resumeText: '',
  portfolioLinksText: '',
};

function toDraft(profile: ApplicantProfile, fallbackName?: string): ApplicantProfileDraft {
  return {
    fullName: profile.fullName || fallbackName || '',
    university: profile.university ?? '',
    studyCourse: profile.studyCourse ?? '',
    graduationYear: profile.graduationYear?.toString() ?? '',
    about: profile.about ?? '',
    resumeText: profile.resumeText ?? '',
    portfolioLinksText: profile.portfolioLinks.join('\n'),
  };
}

function buildPayload(draft: ApplicantProfileDraft): ApplicantProfileUpdatePayload {
  return {
    fullName: draft.fullName.trim(),
    university: draft.university.trim() || null,
    studyCourse: draft.studyCourse.trim() || null,
    graduationYear: draft.graduationYear.trim() ? Number(draft.graduationYear) : null,
    about: draft.about.trim() || null,
    resumeText: draft.resumeText.trim() || null,
    portfolioLinks: draft.portfolioLinksText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

export function ApplicantProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ApplicantProfileDraft>(emptyDraft);
  const [savedDraft, setSavedDraft] = useState<ApplicantProfileDraft>(emptyDraft);
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['applicant-profile', 'me'],
    queryFn: getApplicantProfileMe,
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    const nextDraft = toDraft(profileQuery.data, user?.displayName);
    setDraft(nextDraft);
    setSavedDraft(nextDraft);
  }, [profileQuery.data, user?.displayName]);

  const saveMutation = useMutation({
    mutationFn: updateApplicantProfileMe,
    onSuccess: (profile) => {
      queryClient.setQueryData(['applicant-profile', 'me'], profile);
      const nextDraft = toDraft(profile, user?.displayName);
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
      setIsEditing(false);
      setSuccess('Профиль сохранён');
    },
  });

  const initials = useMemo(() => {
    const source = draft.fullName || user?.displayName || 'Профиль';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() ?? '')
      .join('');
  }, [draft.fullName, user?.displayName]);

  const skills = profileQuery.data?.skills ?? [];
  const links = draft.portfolioLinksText
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  const updateField = (field: keyof ApplicantProfileDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setSuccess(null);
  };

  const handleSave = () => {
    saveMutation.mutate(buildPayload(draft));
  };

  const handleCancel = () => {
    setDraft(savedDraft);
    setIsEditing(false);
    setSuccess(null);
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid #d9e0ea',
    borderRadius: 24,
    padding: 28,
    boxShadow: '0 18px 50px rgba(16, 24, 40, 0.08)',
  };

  const sectionStyle: React.CSSProperties = {
    ...panelStyle,
    padding: 22,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 48,
    border: '1px solid #d9e0ea',
    borderRadius: 14,
    padding: '12px 14px',
    fontSize: 16,
    background: '#fff',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 120,
    resize: 'vertical',
  };

  const mutedStyle: React.CSSProperties = {
    margin: 0,
    color: '#667085',
  };

  const metaCardStyle: React.CSSProperties = {
    border: '1px solid #d9e0ea',
    borderRadius: 18,
    padding: 16,
    background: '#fff',
  };

  if (profileQuery.isLoading) {
    return <div>Загружаем профиль соискателя…</div>;
  }

  if (profileQuery.isError) {
    return <div>Не удалось загрузить профиль: {getErrorMessage(profileQuery.error)}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={panelStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.02 }}>Профиль соискателя</h1>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {!isEditing ? (
              <button className="btn" type="button" onClick={() => setIsEditing(true)}>
                Редактировать
              </button>
            ) : (
              <>
                <button className="btn" type="button" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Сохраняем…' : 'Сохранить'}
                </button>
                <button className="btn btn--secondary" type="button" onClick={handleCancel}>
                  Отменить
                </button>
              </>
            )}
          </div>
        </div>

        {success ? <p style={{ color: '#027a48', marginTop: 14 }}>{success}</p> : null}
        {saveMutation.isError ? (
          <p style={{ color: '#b42318', marginTop: 14 }}>{getErrorMessage(saveMutation.error)}</p>
        ) : null}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)',
          gap: 20,
        }}
      >
        <div style={{ ...sectionStyle, display: 'grid', gap: 18, alignContent: 'start' }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2f6fed, #4f46e5)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 28,
              fontWeight: 800,
              boxShadow: '0 14px 28px rgba(47,111,237,0.22)',
            }}
          >
            {initials || 'П'}
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div style={metaCardStyle}>
              <p style={{ ...mutedStyle, fontSize: 13 }}>Отображаемое имя аккаунта</p>
              <strong style={{ fontSize: 20 }}>{user?.displayName ?? '—'}</strong>
            </div>

            <div style={metaCardStyle}>
              <p style={{ ...mutedStyle, fontSize: 13 }}>Email</p>
              <strong>{user?.email ?? '—'}</strong>
            </div>

            <div style={metaCardStyle}>
              <p style={{ ...mutedStyle, fontSize: 13 }}>Роль</p>
              <strong>{user?.role ?? 'applicant'}</strong>
            </div>

            <div style={metaCardStyle}>
              <p style={{ ...mutedStyle, fontSize: 13 }}>Навыки из backend-профиля</p>
              {skills.length ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {skills.map((skill) => (
                    <span key={skill} className="chip">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <span>Пока не заполнены</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <section style={sectionStyle}>
            <h2 style={{ margin: '0 0 16px', fontSize: 28 }}>Основная информация</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>ФИО</label>
                {isEditing ? (
                  <input
                    style={inputStyle}
                    value={draft.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    placeholder="Например, Иван Петров"
                  />
                ) : (
                  <div style={metaCardStyle}>{draft.fullName || 'Не заполнено'}</div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Вуз</label>
                {isEditing ? (
                  <input
                    style={inputStyle}
                    value={draft.university}
                    onChange={(event) => updateField('university', event.target.value)}
                    placeholder="Например, ТПУ"
                  />
                ) : (
                  <div style={metaCardStyle}>{draft.university || 'Не заполнено'}</div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Курс / программа</label>
                {isEditing ? (
                  <input
                    style={inputStyle}
                    value={draft.studyCourse}
                    onChange={(event) => updateField('studyCourse', event.target.value)}
                    placeholder="Например, 4 курс"
                  />
                ) : (
                  <div style={metaCardStyle}>{draft.studyCourse || 'Не заполнено'}</div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Год выпуска</label>
                {isEditing ? (
                  <input
                    style={inputStyle}
                    value={draft.graduationYear}
                    onChange={(event) => updateField('graduationYear', event.target.value)}
                    placeholder="Например, 2027"
                  />
                ) : (
                  <div style={metaCardStyle}>{draft.graduationYear || 'Не заполнено'}</div>
                )}
              </div>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ margin: '0 0 16px', fontSize: 28 }}>О себе и резюме</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={labelStyle}>О себе</label>
                {isEditing ? (
                  <textarea
                    style={textareaStyle}
                    value={draft.about}
                    onChange={(event) => updateField('about', event.target.value)}
                  />
                ) : (
                  <div style={metaCardStyle}>{draft.about || 'Не заполнено'}</div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Резюме / портфолио текстом</label>
                {isEditing ? (
                  <textarea
                    style={textareaStyle}
                    value={draft.resumeText}
                    onChange={(event) => updateField('resumeText', event.target.value)}
                  />
                ) : (
                  <div style={metaCardStyle}>{draft.resumeText || 'Не заполнено'}</div>
                )}
              </div>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ margin: '0 0 16px', fontSize: 28 }}>Ссылки на портфолио</h2>
            {isEditing ? (
              <textarea
                style={textareaStyle}
                value={draft.portfolioLinksText}
                onChange={(event) => updateField('portfolioLinksText', event.target.value)}
                placeholder={'По одной ссылке с новой строки\nhttps://github.com/username\nhttps://t.me/username'}
              />
            ) : links.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {links.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer" className="card-link">
                    {link}
                  </a>
                ))}
              </div>
            ) : (
              <div style={metaCardStyle}>Ссылки пока не добавлены</div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
