import { useMemo, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import styles from '@/app/styles/ApplicantContactsPage.module.css';

type ContactStatus = 'accepted' | 'pending' | 'blocked';

type ContactItem = {
  id: string;
  name: string;
  university: string;
  direction: string;
  status: ContactStatus;
  interests: string[];
};

const DEMO_CONTACTS: ContactItem[] = [
  {
    id: '1',
    name: 'Алина Морозова',
    university: 'ТПУ',
    direction: 'Frontend / React',
    status: 'accepted',
    interests: ['Стажировки', 'Frontend', 'UI/UX'],
  },
  {
    id: '2',
    name: 'Игорь Сафонов',
    university: 'КузГТУ',
    direction: 'Backend / Rust',
    status: 'accepted',
    interests: ['Rust', 'PostgreSQL', 'Backend'],
  },
  {
    id: '3',
    name: 'Мария Волкова',
    university: 'НГУ',
    direction: 'Data Science',
    status: 'pending',
    interests: ['ML', 'Python', 'CV'],
  },
];

function statusLabel(status: ContactStatus) {
  switch (status) {
    case 'accepted':
      return 'Контакт';
    case 'pending':
      return 'Запрос';
    case 'blocked':
      return 'Скрыт';
    default:
      return status;
  }
}

function statusClass(status: ContactStatus, stylesObj: Record<string, string>) {
  switch (status) {
    case 'accepted':
      return stylesObj.statusAccepted;
    case 'pending':
      return stylesObj.statusPending;
    case 'blocked':
      return stylesObj.statusBlocked;
    default:
      return '';
  }
}

export function ApplicantContactsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<ContactItem[]>(DEMO_CONTACTS);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return contacts;

    return contacts.filter((item) => {
      const haystack = [
        item.name,
        item.university,
        item.direction,
        item.interests.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [contacts, query]);

  const updateStatus = (id: string, status: ContactStatus) => {
    setContacts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.title}>Контакты и нетворкинг</h1>
            <p className={styles.subtitle}>Список контактов пользователя.</p>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.leftColumn}>
          <article className={styles.card}>
            <div className={styles.toolbar}>
              <div>
                <h2 className={styles.cardTitle}>Мои контакты</h2>
                <p className={styles.smallText}>
                  Можно искать людей, смотреть их карьерные интересы и управлять статусом связи.
                </p>
              </div>

              <input
                className={styles.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по имени, вузу, направлению"
              />
            </div>

            <div className={styles.contactList}>
              {filtered.map((contact) => (
                <div key={contact.id} className={styles.contactCard}>
                  <div className={styles.contactHead}>
                    <div>
                      <div className={styles.contactName}>{contact.name}</div>
                      <div className={styles.contactMeta}>
                        {contact.university} · {contact.direction}
                      </div>
                    </div>

                    <div
                      className={`${styles.statusBadge} ${statusClass(contact.status, styles)}`}
                    >
                      {statusLabel(contact.status)}
                    </div>
                  </div>

                  <div className={styles.block}>
                    <div className={styles.blockLabel}>Карьерные интересы</div>
                    <div className={styles.tagList}>
                      {contact.interests.map((item) => (
                        <span key={item} className={styles.tag}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.contactActions}>
                    {contact.status === 'pending' ? (
                      <>
                        <button
                          className="btn"
                          type="button"
                          onClick={() => updateStatus(contact.id, 'accepted')}
                        >
                          Принять
                        </button>
                        <button
                          className="btn btn--secondary"
                          type="button"
                          onClick={() => updateStatus(contact.id, 'blocked')}
                        >
                          Скрыть
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn--secondary"
                          type="button"
                          onClick={() => updateStatus(contact.id, 'accepted')}
                        >
                          Оставить в контактах
                        </button>
                        <button
                          className="btn btn--secondary"
                          type="button"
                          onClick={() => updateStatus(contact.id, 'blocked')}
                        >
                          Убрать
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {!filtered.length && (
                <div className={styles.emptyState}>
                  По текущему запросу контакты не найдены.
                </div>
              )}
            </div>
          </article>
        </div>

        <div className={styles.rightColumn}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Пользователь</h2>

            <div className={styles.infoList}>
              <div>
                <div className={styles.muted}>Имя</div>
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
            <h2 className={styles.cardTitle}>Сводка</h2>

            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <span>Всего контактов</span>
                <strong>{contacts.length}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Подтверждённых</span>
                <strong>{contacts.filter((item) => item.status === 'accepted').length}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Ожидающих</span>
                <strong>{contacts.filter((item) => item.status === 'pending').length}</strong>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Примечание</h2>
            <p className={styles.note}>
              Сейчас это фронтовая заглушка для интерфейса. Позже сюда можно подключить реальные
              `/contacts`, `/contacts/requests` и видимость карьерных интересов по правилам
              приватности.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}