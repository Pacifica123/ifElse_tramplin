import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import styles from '@/app/styles/ApplicantPrivacyPage.module.css';

type PrivacyDraft = {
  profileVisibleToAllAuth: boolean;
  resumeVisibleToContacts: boolean;
  resumeVisibleToAllAuth: boolean;
  applicationsVisibleToContacts: boolean;
  applicationsVisibleToAllAuth: boolean;
};

const STORAGE_KEY = 'trampolin.applicantPrivacyDraft.v1';

export function ApplicantPrivacyPage() {
  const { user } = useAuth();

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        setDraft(baseDraft);
        setSavedDraft(baseDraft);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<PrivacyDraft>;
      const merged: PrivacyDraft = {
        ...baseDraft,
        ...parsed,
      };

      setDraft(merged);
      setSavedDraft(merged);
    } catch {
      setDraft(baseDraft);
      setSavedDraft(baseDraft);
    }
  }, [baseDraft]);

  const updateField = <K extends keyof PrivacyDraft>(key: K, value: PrivacyDraft[K]) => {
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

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.title}>Настройки приватности</h1>
            <p className={styles.subtitle}>Видимость профиля, резюме и откликов.</p>
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

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Примечание</h2>
            <p className={styles.note}>
              Сейчас это локальная форма для фронта. Позже сюда можно подключить реальный
              `GET/PATCH /privacy-settings/me`.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}