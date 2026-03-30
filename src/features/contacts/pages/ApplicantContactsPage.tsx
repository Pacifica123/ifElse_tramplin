import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  createContactRequest,
  getContacts,
  updateContactStatus,
  type Contact,
  type ContactStatus,
} from '@/shared/api/contacts';
import { getErrorMessage } from '@/shared/api/errors';
import styles from '@/app/styles/ApplicantContactsPage.module.css';

function statusLabel(status: ContactStatus) {
  switch (status) {
    case 'accepted':
      return 'Контакт';
    case 'pending':
      return 'Запрос';
    case 'rejected':
      return 'Отклонён';
    case 'blocked':
      return 'Заблокирован';
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
    case 'rejected':
      return stylesObj.statusBlocked;
    default:
      return '';
  }
}

function getOtherUserId(item: Contact, currentUserId?: number | null) {
  if (!currentUserId) return item.addresseeUserId;
  return item.requesterUserId === currentUserId ? item.addresseeUserId : item.requesterUserId;
}

function ContactActions({
  item,
  currentUserId,
  isPending,
  onChangeStatus,
}: {
  item: Contact;
  currentUserId?: number;
  isPending: boolean;
  onChangeStatus: (status: ContactStatus) => void;
}) {
  const isAddressee = item.addresseeUserId === currentUserId;
  const isPendingReview = item.status === 'pending' && isAddressee;

  if (isPendingReview) {
    return (
      <div className={styles.contactActions}>
        <button className="btn" type="button" onClick={() => onChangeStatus('accepted')} disabled={isPending}>
          Принять
        </button>
        <button className="btn btn--secondary" type="button" onClick={() => onChangeStatus('rejected')} disabled={isPending}>
          Отклонить
        </button>
        <button className="btn btn--secondary" type="button" onClick={() => onChangeStatus('blocked')} disabled={isPending}>
          Заблокировать
        </button>
      </div>
    );
  }

  return (
    <div className={styles.contactActions}>
      {item.status !== 'accepted' ? (
        <button className="btn btn--secondary" type="button" onClick={() => onChangeStatus('accepted')} disabled={isPending}>
          Пометить как контакт
        </button>
      ) : null}
      {item.status !== 'blocked' ? (
        <button className="btn btn--secondary" type="button" onClick={() => onChangeStatus('blocked')} disabled={isPending}>
          Заблокировать
        </button>
      ) : null}
    </div>
  );
}

export function ApplicantContactsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [addresseeUserId, setAddresseeUserId] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });

  const createMutation = useMutation({
    mutationFn: createContactRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setAddresseeUserId('');
      setSuccess('Запрос в контакты отправлен');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ contactId, status }: { contactId: number; status: ContactStatus }) => updateContactStatus(contactId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSuccess('Статус контакта обновлён');
    },
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source = contactsQuery.data ?? [];
    if (!needle) return source;

    return source.filter((item) => {
      const haystack = [
        String(item.id),
        String(item.requesterUserId),
        String(item.addresseeUserId),
        item.status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [contactsQuery.data, query]);

  const acceptedCount = (contactsQuery.data ?? []).filter((item) => item.status === 'accepted').length;
  const pendingCount = (contactsQuery.data ?? []).filter((item) => item.status === 'pending').length;

  const submitRequest = () => {
    const target = Number(addresseeUserId);
    if (!target) return;
    setSuccess(null);
    createMutation.mutate(target);
  };

  if (contactsQuery.isLoading) {
    return <div>Загружаем контакты…</div>;
  }

  if (contactsQuery.isError) {
    return <div>Не удалось загрузить контакты: {getErrorMessage(contactsQuery.error)}</div>;
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
          <div>
            <h1 style={{ margin: 0, fontSize: 42, textAlign:'center' }}>Контакты и нетворкинг</h1>
          </div>
        {success ? <p style={{ color: '#027a48', margin: 0 }}>{success}</p> : null}
      </section>

      <section className={styles.grid}>
        <div className={styles.leftColumn}>
          <article className={styles.card}>
            <div className={styles.toolbar}>
              <div>
                <h2 className={styles.cardTitle}>Мои контакты</h2>
              </div>

              <input
                className={styles.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по id и статусу"
              />
            </div>

            <div className={styles.contactList}>
              {filtered.map((contact) => {
                const otherUserId = getOtherUserId(contact, user?.id);
                const isIncomingPending = contact.status === 'pending' && contact.addresseeUserId === user?.id;

                return (
                  <div key={contact.id} className={styles.contactCard}>
                    <div className={styles.contactHead}>
                      <div>
                        <div className={styles.contactName}>Пользователь #{otherUserId}</div>
                        <div className={styles.contactMeta}>
                          Связь #{contact.id} · {contact.requesterUserId === user?.id ? 'исходящий' : 'входящий'} запрос
                        </div>
                      </div>

                      <div className={`${styles.statusBadge} ${statusClass(contact.status, styles)}`}>
                        {statusLabel(contact.status)}
                      </div>
                    </div>

                    <div className={styles.block}>
                      <div className={styles.blockLabel}>Детали связи</div>
                      <div className={styles.tagList}>
                        <span className={styles.tag}>requester #{contact.requesterUserId}</span>
                        <span className={styles.tag}>addressee #{contact.addresseeUserId}</span>
                        {isIncomingPending ? <span className={styles.tag}>ожидает вашего решения</span> : null}
                      </div>
                    </div>

                    <ContactActions
                      item={contact}
                      currentUserId={user?.id}
                      isPending={updateMutation.isPending}
                      onChangeStatus={(status) => {
                        setSuccess(null);
                        updateMutation.mutate({ contactId: contact.id, status });
                      }}
                    />
                  </div>
                );
              })}

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
            <h2 className={styles.cardTitle}>Новый запрос</h2>
            <div className={styles.infoList}>
              <div>
                <div className={styles.muted}>ID пользователя-соискателя</div>
                <input
                  className={styles.search}
                  value={addresseeUserId}
                  onChange={(event) => setAddresseeUserId(event.target.value)}
                  placeholder="Например, 12"
                />
              </div>
              <button className="btn" type="button" onClick={submitRequest} disabled={createMutation.isPending || !addresseeUserId.trim()}>
                {createMutation.isPending ? 'Отправляем…' : 'Отправить запрос'}
              </button>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Сводка</h2>

            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <span>Всего связей</span>
                <strong>{contactsQuery.data?.length ?? 0}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Подтверждённых</span>
                <strong>{acceptedCount}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Ожидающих</span>
                <strong>{pendingCount}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      {createMutation.isError ? <p style={{ color: '#b42318' }}>{getErrorMessage(createMutation.error)}</p> : null}
      {updateMutation.isError ? <p style={{ color: '#b42318' }}>{getErrorMessage(updateMutation.error)}</p> : null}
    </div>
  );
}
