import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import styles from '@/app/styles/EmployerProfilePage.module.css';

type VerificationStatus = 'pending' | 'verified' | 'rejected';

type EmployerProfileDraft = {
  companyName: string;
  shortDescription: string;
  industry: string;
  websiteUrl: string;
  cityName: string;
  promoVideoUrl: string;
  socialLinksText: string;
  officePhotosText: string;
  verificationStatus: VerificationStatus;
  verificationComment: string;
};

const STORAGE_KEY = 'trampolin.employerProfileDraft.v1';

function prettyRole(role?: string) {
  switch (role) {
    case 'employer':
      return 'Работодатель';
    case 'applicant':
      return 'Соискатель';
    case 'curator':
      return 'Куратор';
    case 'admin_curator':
      return 'Админ-куратор';
    default:
      return 'Пользователь';
  }
}

function prettyStatus(status: VerificationStatus) {
  switch (status) {
    case 'verified':
      return 'Верифицирован';
    case 'rejected':
      return 'Отклонён';
    case 'pending':
    default:
      return 'На проверке';
  }
}

function statusClass(status: VerificationStatus) {
  switch (status) {
    case 'verified':
      return styles.statusVerified;
    case 'rejected':
      return styles.statusRejected;
    case 'pending':
    default:
      return styles.statusPending;
  }
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function EmployerProfilePage() {
  const { user } = useAuth();

  const baseDraft = useMemo<EmployerProfileDraft>(
    () => ({
      companyName: user?.displayName ?? '',
      shortDescription: '',
      industry: '',
      websiteUrl: '',
      cityName: '',
      promoVideoUrl: '',
      socialLinksText: '',
      officePhotosText: '',
      verificationStatus: 'pending',
      verificationComment:
        'Статус пока локальный. Позже сюда подключится backend employer-profile/me.',
    }),
    [user],
  );

  const [draft, setDraft] = useState<EmployerProfileDraft>(baseDraft);
  const [savedDraft, setSavedDraft] = useState<EmployerProfileDraft>(baseDraft);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        setDraft(baseDraft);
        setSavedDraft(baseDraft);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<EmployerProfileDraft>;

      const merged: EmployerProfileDraft = {
        ...baseDraft,
        ...parsed,
        companyName: parsed.companyName?.trim() || baseDraft.companyName,
      };

      setDraft(merged);
      setSavedDraft(merged);
    } catch {
      setDraft(baseDraft);
      setSavedDraft(baseDraft);
    }
  }, [baseDraft]);

  const updateField = <K extends keyof EmployerProfileDraft>(
    key: K,
    value: EmployerProfileDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setSavedDraft(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(savedDraft);
    setIsEditing(false);
  };

  const socialLinks = splitLines(draft.socialLinksText);
  const officePhotos = splitLines(draft.officePhotosText);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.title}>Профиль работодателя</h1>
            <p className={styles.subtitle}>Карточка компании и статус верификации.</p>
          </div>

          <div className={styles.actions}>
            {!isEditing ? (
              <button className="btn" type="button" onClick={() => setIsEditing(true)}>
                Редактировать
              </button>
            ) : (
              <>
                <button className="btn btn--secondary" type="button" onClick={handleCancel}>
                  Отменить
                </button>
                <button className="btn" type="button" onClick={handleSave}>
                  Сохранить
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.leftColumn}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Основная информация</h2>

            <div className={styles.fields}>
              <label className={styles.field}>
                <span>Компания</span>
                <input
                  value={draft.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  disabled={!isEditing}
                />
              </label>

              <label className={styles.field}>
                <span>Сфера деятельности</span>
                <input
                  value={draft.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Например, FinTech, EdTech, заказная разработка"
                />
              </label>

              <label className={styles.field}>
                <span>Краткое описание</span>
                <textarea
                  rows={5}
                  value={draft.shortDescription}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Чем занимается компания, какие направления развивает, кого ищет"
                />
              </label>

              <div className={styles.twoCols}>
                <label className={styles.field}>
                  <span>Сайт</span>
                  <input
                    value={draft.websiteUrl}
                    onChange={(e) => updateField('websiteUrl', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://company.ru"
                  />
                </label>

                <label className={styles.field}>
                  <span>Город</span>
                  <input
                    value={draft.cityName}
                    onChange={(e) => updateField('cityName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Кемерово"
                  />
                </label>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Ссылки и медиа</h2>

            <div className={styles.fields}>
              <label className={styles.field}>
                <span>Соцсети и внешние ссылки</span>
                <textarea
                  rows={5}
                  value={draft.socialLinksText}
                  onChange={(e) => updateField('socialLinksText', e.target.value)}
                  disabled={!isEditing}
                  placeholder={'По одной ссылке с новой строки\nhttps://t.me/company\nhttps://vk.com/company'}
                />
              </label>

              <label className={styles.field}>
                <span>Ссылка на видео-презентацию</span>
                <input
                  value={draft.promoVideoUrl}
                  onChange={(e) => updateField('promoVideoUrl', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://youtube.com/..."
                />
              </label>

              <label className={styles.field}>
                <span>Фото офиса</span>
                <textarea
                  rows={5}
                  value={draft.officePhotosText}
                  onChange={(e) => updateField('officePhotosText', e.target.value)}
                  disabled={!isEditing}
                  placeholder={'По одной ссылке с новой строки\nhttps://...\nhttps://...'}
                />
              </label>
            </div>
          </article>
        </div>

        <div className={styles.rightColumn}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Аккаунт</h2>

            <div className={styles.infoList}>
              <div>
                <div className={styles.muted}>Отображаемое имя</div>
                <strong>{user?.displayName || '—'}</strong>
              </div>

              <div>
                <div className={styles.muted}>Email</div>
                <strong>{user?.email || '—'}</strong>
              </div>

              <div>
                <div className={styles.muted}>Роль</div>
                <strong>{prettyRole(user?.role)}</strong>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Верификация</h2>

            <div className={`${styles.statusBadge} ${statusClass(draft.verificationStatus)}`}>
              {prettyStatus(draft.verificationStatus)}
            </div>

            <label className={styles.field}>
              <span>Комментарий по статусу</span>
              <textarea
                rows={4}
                value={draft.verificationComment}
                onChange={(e) => updateField('verificationComment', e.target.value)}
                disabled={!isEditing}
                placeholder="Комментарий куратора или внутреннее примечание"
              />
            </label>

            <div className={styles.note}>
              Сейчас это локальная форма. Когда backend добьёт `GET/PATCH /employer-profile/me`,
              страницу можно будет переключить на реальные данные.
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Предпросмотр</h2>

            <div className={styles.infoList}>
              <div>
                <div className={styles.muted}>Компания</div>
                <strong>{draft.companyName || '—'}</strong>
              </div>

              <div>
                <div className={styles.muted}>Сфера</div>
                <span>{draft.industry || '—'}</span>
              </div>

              <div>
                <div className={styles.muted}>Город</div>
                <span>{draft.cityName || '—'}</span>
              </div>

              <div>
                <div className={styles.muted}>Сайт</div>
                <span>{draft.websiteUrl || '—'}</span>
              </div>

              <div>
                <div className={styles.muted}>Соцсети</div>
                {socialLinks.length ? (
                  <ul className={styles.list}>
                    {socialLinks.map((link) => (
                      <li key={link}>{link}</li>
                    ))}
                  </ul>
                ) : (
                  <span>—</span>
                )}
              </div>

              <div>
                <div className={styles.muted}>Фото офиса</div>
                {officePhotos.length ? (
                  <ul className={styles.list}>
                    {officePhotos.map((link) => (
                      <li key={link}>{link}</li>
                    ))}
                  </ul>
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}