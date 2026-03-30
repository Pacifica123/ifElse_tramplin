import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import { getErrorMessage } from '@/shared/api/errors';
import {
  getPrivacySettingsMe,
  updatePrivacySettingsMe,
  type PrivacySettings,
} from '@/shared/api/privacySettings';
import styles from '@/app/styles/ApplicantPrivacyPage.module.css';

type PrivacyDraft = PrivacySettings;

export function ApplicantPrivacyPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const baseDraft = useMemo<PrivacyDraft>(
    () => ({
      profileVisibleToAllAuth: true,
      resumeVisibleToContacts: true,
      resumeVisibleToAllAuth: false,
      applicationsVisibleToContacts: true,
      applicationsVisibleToAllAuth: false,
    }),
    [],
  );

  const [draft, setDraft] = useState<PrivacyDraft>(baseDraft);
  const [savedDraft, setSavedDraft] = useState<PrivacyDraft>(baseDraft);
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const privacyQuery = useQuery({
    queryKey: ['privacy-settings', 'me'],
    queryFn: getPrivacySettingsMe,
  });

  useEffect(() => {
    if (!privacyQuery.data) return;
    setDraft(privacyQuery.data);
    setSavedDraft(privacyQuery.data);
  }, [privacyQuery.data]);

  const saveMutation = useMutation({
    mutationFn: updatePrivacySettingsMe,
    onSuccess: (data) => {
      queryClient.setQueryData(['privacy-settings', 'me'], data);
      setDraft(data);
      setSavedDraft(data);
      setIsEditing(false);
      setSuccess('Настройки приватности сохранены');
    },
  });

  const updateField = <K extends keyof PrivacyDraft>(key: K, value: PrivacyDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const handleSave = () => {
    saveMutation.mutate(draft);
  };

  const handleCancel = () => {
    setDraft(savedDraft);
    setIsEditing(false);
    setSuccess(null);
  };

  if (privacyQuery.isLoading) {
    return <div>Загружаем настройки приватности…</div>;
  }

  if (privacyQuery.isError) {
    return <div>Не удалось загрузить настройки: {getErrorMessage(privacyQuery.error)}</div>;
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 style={{ margin: 0, fontSize: 42, textAlign:'center' }}>Настройки приватности</h1>
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
        {success ? <p style={{ color: '#027a48', margin: '12px 0 0' }}>{success}</p> : null}
        {saveMutation.isError ? <p style={{ color: '#b42318', margin: '12px 0 0' }}>{getErrorMessage(saveMutation.error)}</p> : null}
      </section>

      <section className={styles.grid}>
        <div className={styles.leftColumn}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Основные настройки</h2>

            <div className={styles.switchList}>
              <label className={styles.switchRow}>
                <div>
                  <div className={styles.switchTitle}>Показывать профиль всем авторизованным</div>
                  <div className={styles.switchText}>
                    Другие пользователи платформы смогут видеть ваш профиль для нетворкинга.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={draft.profileVisibleToAllAuth}
                  onChange={(e) => updateField('profileVisibleToAllAuth', e.target.checked)}
                  disabled={!isEditing}
                />
              </label>

              <label className={styles.switchRow}>
                <div>
                  <div className={styles.switchTitle}>Показывать резюме контактам</div>
                  <div className={styles.switchText}>
                    Ваши подтверждённые контакты смогут смотреть резюме и портфолио.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={draft.resumeVisibleToContacts}
                  onChange={(e) => updateField('resumeVisibleToContacts', e.target.checked)}
                  disabled={!isEditing}
                />
              </label>

              <label className={styles.switchRow}>
                <div>
                  <div className={styles.switchTitle}>Показывать резюме всем авторизованным</div>
                  <div className={styles.switchText}>
                    Более открытый режим для карьерного нетворкинга и поиска работодателями.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={draft.resumeVisibleToAllAuth}
                  onChange={(e) => updateField('resumeVisibleToAllAuth', e.target.checked)}
                  disabled={!isEditing}
                />
              </label>

              <label className={styles.switchRow}>
                <div>
                  <div className={styles.switchTitle}>Показывать отклики контактам</div>
                  <div className={styles.switchText}>
                    Контакты смогут видеть ваши карьерные интересы и активность по возможностям.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={draft.applicationsVisibleToContacts}
                  onChange={(e) => updateField('applicationsVisibleToContacts', e.target.checked)}
                  disabled={!isEditing}
                />
              </label>

              <label className={styles.switchRow}>
                <div>
                  <div className={styles.switchTitle}>Показывать отклики всем авторизованным</div>
                  <div className={styles.switchText}>
                    Самый открытый режим. Подходит, если делаешь упор на активный нетворкинг.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={draft.applicationsVisibleToAllAuth}
                  onChange={(e) => updateField('applicationsVisibleToAllAuth', e.target.checked)}
                  disabled={!isEditing}
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
                <div className={styles.muted}>Пользователь</div>
                <strong>{user?.displayName || '—'}</strong>
              </div>

              <div>
                <div className={styles.muted}>Email</div>
                <strong>{user?.email || '—'}</strong>
              </div>

              <div>
                <div className={styles.muted}>Роль</div>
                <strong>Соискатель</strong>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Сводка видимости</h2>

            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <span>Профиль</span>
                <strong>{draft.profileVisibleToAllAuth ? 'Открыт' : 'Скрыт'}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>Резюме для контактов</span>
                <strong>{draft.resumeVisibleToContacts ? 'Да' : 'Нет'}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>Резюме для всех</span>
                <strong>{draft.resumeVisibleToAllAuth ? 'Да' : 'Нет'}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>Отклики для контактов</span>
                <strong>{draft.applicationsVisibleToContacts ? 'Да' : 'Нет'}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>Отклики для всех</span>
                <strong>{draft.applicationsVisibleToAllAuth ? 'Да' : 'Нет'}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
