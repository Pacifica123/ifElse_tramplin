import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';

type ApplicantProfileDraft = {
  fullName: string;
  university: string;
  studyCourse: string;
  graduationYear: string;
  about: string;
  resumeText: string;
  skillsText: string;
  portfolioLinksText: string;
};

const emptyDraft: ApplicantProfileDraft = {
  fullName: '',
  university: '',
  studyCourse: '',
  graduationYear: '',
  about: '',
  resumeText: '',
  skillsText: '',
  portfolioLinksText: '',
};

function parseStoredDraft(raw: string | null): ApplicantProfileDraft | null {
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as Partial<ApplicantProfileDraft>;
    return {
      ...emptyDraft,
      ...data,
    };
  } catch {
    return null;
  }
}

export function ApplicantProfilePage() {
  const { user } = useAuth();
  const storageKey = useMemo(
    () => `trampolin.applicant-profile.${user?.id ?? 'guest'}`,
    [user?.id],
  );

  const [draft, setDraft] = useState<ApplicantProfileDraft>(emptyDraft);
  const [savedDraft, setSavedDraft] = useState<ApplicantProfileDraft>(emptyDraft);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const stored = parseStoredDraft(localStorage.getItem(storageKey));

    const nextDraft: ApplicantProfileDraft = stored ?? {
      ...emptyDraft,
      fullName: user?.displayName ?? '',
    };

    setDraft(nextDraft);
    setSavedDraft(nextDraft);
  }, [storageKey, user?.displayName]);

  const initials = useMemo(() => {
    const source = draft.fullName || user?.displayName || 'Профиль';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() ?? '')
      .join('');
  }, [draft.fullName, user?.displayName]);

  const skills = useMemo(
    () => draft.skillsText.split(',').map((item) => item.trim()).filter(Boolean),
    [draft.skillsText],
  );

  const links = useMemo(
    () =>
      draft.portfolioLinksText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [draft.portfolioLinksText],
  );

  const updateField = (field: keyof ApplicantProfileDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(draft));
    setSavedDraft(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(savedDraft);
    setIsEditing(false);
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
            <h1 style={{ margin: 0, fontSize: 56, lineHeight: 1.02 }}>Профиль соискателя</h1>
            <p style={{ ...mutedStyle, marginTop: 10, fontSize: 18 }}>
              Здесь можно показать основные данные пользователя и дать ему возможность редактировать профиль.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {!isEditing ? (
              <button className="btn" type="button" onClick={() => setIsEditing(true)}>
                Редактировать
              </button>
            ) : (
              <>
                <button className="btn" type="button" onClick={handleSave}>
                  Сохранить
                </button>
                <button className="btn btn--secondary" type="button" onClick={handleCancel}>
                  Отменить
                </button>
              </>
            )}
          </div>
        </div>
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
              <p style={{ ...mutedStyle, fontSize: 13 }}>Отображаемое имя</p>
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
              <p style={{ ...mutedStyle, fontSize: 13 }}>Статус профиля</p>
              <strong>{isEditing ? 'Редактирование' : 'Черновик / локальные данные'}</strong>
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
                    placeholder="3 курс, Программная инженерия"
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
                    placeholder="2027"
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
                    placeholder="Коротко опиши себя, свои цели и интересы"
                  />
                ) : (
                  <div style={metaCardStyle}>{draft.about || 'Добавь краткое описание профиля.'}</div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Резюме / портфолио</label>
                {isEditing ? (
                  <textarea
                    style={textareaStyle}
                    value={draft.resumeText}
                    onChange={(event) => updateField('resumeText', event.target.value)}
                    placeholder="Опыт проектов, участие в хакатонах, стажировках и т.д."
                  />
                ) : (
                  <div style={metaCardStyle}>{draft.resumeText || 'Пока пусто.'}</div>
                )}
              </div>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ margin: '0 0 16px', fontSize: 28 }}>Навыки и ссылки</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={labelStyle}>Навыки</label>
                {isEditing ? (
                  <input
                    style={inputStyle}
                    value={draft.skillsText}
                    onChange={(event) => updateField('skillsText', event.target.value)}
                    placeholder="React, TypeScript, SQL, UI/UX"
                  />
                ) : (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {skills.length ? (
                      skills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 999,
                            background: '#eef4ff',
                            color: '#2043a3',
                            fontWeight: 600,
                          }}
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <div style={metaCardStyle}>Навыки пока не заполнены.</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Ссылки на портфолио</label>
                {isEditing ? (
                  <textarea
                    style={{ ...textareaStyle, minHeight: 100 }}
                    value={draft.portfolioLinksText}
                    onChange={(event) => updateField('portfolioLinksText', event.target.value)}
                    placeholder={['https://github.com/username', 'https://t.me/username', 'https://portfolio.example.com'].join('\n')}
                  />
                ) : links.length ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {links.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          ...metaCardStyle,
                          color: '#1f57c5',
                          textDecoration: 'underline',
                        }}
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div style={metaCardStyle}>Ссылки пока не добавлены.</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
