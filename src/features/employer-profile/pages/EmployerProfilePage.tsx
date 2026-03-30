import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import styles from '@/app/styles/EmployerProfilePage.module.css';
import {
  getEmployerProfileMe,
  updateEmployerProfileMe,
  type EmployerProfile,
  type EmployerProfileUpdatePayload,
  type VerificationStatus,
} from '@/shared/api/employerProfile';
import {
  createEmployerVerificationRequest,
  getEmployerVerificationRequest,
} from '@/shared/api/employerDashboard';
import { getErrorMessage } from '@/shared/api/errors';

interface EmployerProfileDraft {
  companyName: string;
  shortDescription: string;
  industry: string;
  websiteUrl: string;
  cityId: string;
  promoVideoUrl: string;
  socialLinksText: string;
  officePhotosText: string;
}

const emptyDraft: EmployerProfileDraft = {
  companyName: '',
  shortDescription: '',
  industry: '',
  websiteUrl: '',
  cityId: '',
  promoVideoUrl: '',
  socialLinksText: '',
  officePhotosText: '',
};

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

function toDraft(profile: EmployerProfile, fallbackName?: string): EmployerProfileDraft {
  return {
    companyName: profile.companyName || fallbackName || '',
    shortDescription: profile.shortDescription ?? '',
    industry: profile.industry ?? '',
    websiteUrl: profile.websiteUrl ?? '',
    cityId: profile.cityId?.toString() ?? '',
    promoVideoUrl: profile.promoVideoUrl ?? '',
    socialLinksText: profile.socialLinks.join('\n'),
    officePhotosText: profile.officePhotos.join('\n'),
  };
}

function toPayload(draft: EmployerProfileDraft): EmployerProfileUpdatePayload {
  return {
    companyName: draft.companyName.trim(),
    shortDescription: draft.shortDescription.trim() || null,
    industry: draft.industry.trim() || null,
    websiteUrl: draft.websiteUrl.trim() || null,
    cityId: draft.cityId.trim() ? Number(draft.cityId) : null,
    promoVideoUrl: draft.promoVideoUrl.trim() || null,
    socialLinks: splitLines(draft.socialLinksText),
    officePhotos: splitLines(draft.officePhotosText),
  };
}

export function EmployerProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<EmployerProfileDraft>(emptyDraft);
  const [savedDraft, setSavedDraft] = useState<EmployerProfileDraft>(emptyDraft);
  const [isEditing, setIsEditing] = useState(false);
  const [verificationCommentDraft, setVerificationCommentDraft] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['employer-profile', 'me'],
    queryFn: getEmployerProfileMe,
  });

  const verificationRequestQuery = useQuery({
    queryKey: ['employer-verification-request', 'me'],
    queryFn: getEmployerVerificationRequest,
    retry: false,
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    const nextDraft = toDraft(profileQuery.data, user?.displayName);
    setDraft(nextDraft);
    setSavedDraft(nextDraft);
  }, [profileQuery.data, user?.displayName]);

  const saveMutation = useMutation({
    mutationFn: updateEmployerProfileMe,
    onSuccess: (profile) => {
      queryClient.setQueryData(['employer-profile', 'me'], profile);
      const nextDraft = toDraft(profile, user?.displayName);
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
      setIsEditing(false);
      setSuccess('Профиль компании сохранён');
    },
  });

  const verificationMutation = useMutation({
    mutationFn: createEmployerVerificationRequest,
    onSuccess: (request) => {
      queryClient.setQueryData(['employer-verification-request', 'me'], request);
      setVerificationCommentDraft('');
      setSuccess('Запрос на верификацию отправлен');
    },
  });

  const socialLinks = splitLines(draft.socialLinksText);
  const officePhotos = splitLines(draft.officePhotosText);

  const effectiveVerificationStatus = profileQuery.data?.verificationStatus ?? 'pending';
  const verificationRequest = verificationRequestQuery.data;
  const verificationRequestMissing = verificationRequestQuery.isError;

  const verificationNote = useMemo(() => {
    if (verificationRequest) {
      return `Запрос уже существует: статус ${verificationRequest.status}.`;
    }
    if (verificationRequestMissing) {
      return 'Запрос на верификацию ещё не отправлялся.';
    }
    return 'Проверяем состояние запроса…';
  }, [verificationRequest, verificationRequestMissing]);

  const updateField = <K extends keyof EmployerProfileDraft>(key: K, value: EmployerProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const handleSave = () => {
    saveMutation.mutate(toPayload(draft));
  };

  const handleCancel = () => {
    setDraft(savedDraft);
    setIsEditing(false);
    setSuccess(null);
  };

  if (profileQuery.isLoading) {
    return <div>Загружаем профиль работодателя…</div>;
  }

  if (profileQuery.isError) {
    return <div>Не удалось загрузить профиль работодателя: {getErrorMessage(profileQuery.error)}</div>;
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.title}>Профиль работодателя</h1>
            <p className={styles.subtitle}>Страница уже читает и сохраняет данные через backend API.</p>
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
                <button className="btn" type="button" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Сохраняем…' : 'Сохранить'}
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
                  <span>City ID</span>
                  <input
                    value={draft.cityId}
                    onChange={(e) => updateField('cityId', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Например, 1"
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

            <div className={`${styles.statusBadge} ${statusClass(effectiveVerificationStatus)}`}>
              {prettyStatus(effectiveVerificationStatus)}
            </div>

            <div className={styles.note}>{profileQuery.data?.verificationComment || 'Комментарий куратора пока отсутствует.'}</div>
            <div className={styles.note}>{verificationNote}</div>

            {effectiveVerificationStatus !== 'verified' ? (
              <>
                <label className={styles.field}>
                  <span>Комментарий к запросу на верификацию</span>
                  <textarea
                    rows={4}
                    value={verificationCommentDraft}
                    onChange={(e) => setVerificationCommentDraft(e.target.value)}
                    placeholder="Например, коротко опишите компанию и попросите проверить профиль"
                    disabled={Boolean(verificationRequest) || verificationMutation.isPending}
                  />
                </label>

                <button
                  className="btn"
                  type="button"
                  disabled={Boolean(verificationRequest) || verificationMutation.isPending}
                  onClick={() => verificationMutation.mutate(verificationCommentDraft || undefined)}
                >
                  {verificationMutation.isPending ? 'Отправляем…' : 'Отправить запрос на верификацию'}
                </button>

                {verificationMutation.isError ? (
                  <p style={{ color: '#b42318', marginTop: 12 }}>
                    {getErrorMessage(verificationMutation.error)}
                  </p>
                ) : null}
              </>
            ) : null}
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
                <div className={styles.muted}>City ID</div>
                <span>{draft.cityId || '—'}</span>
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
