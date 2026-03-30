import { type CSSProperties, FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createCurator } from '@/shared/api/admin';
import { getErrorMessage } from '@/shared/api/errors';

const sectionStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid #d9e0ea',
  borderRadius: 24,
  padding: 24,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
};

export function AdminCuratorsPage() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'curator' | 'admin_curator'>('curator');
  const [success, setSuccess] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createCurator,
    onSuccess: (user) => {
      setSuccess(`Создан пользователь ${user.displayName} (${user.role})`);
      setEmail('');
      setDisplayName('');
      setFullName('');
      setPosition('');
      setPassword('');
      setRole('curator');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    createMutation.mutate({
      email,
      password,
      displayName,
      fullName,
      position: position.trim() || null,
      role,
    });
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={sectionStyle}>
        <h1 style={{ margin: 0, fontSize: 42 }}>Управление кураторами</h1>
        <p style={{ color: '#667085', marginTop: 10 }}>
          Создание новых учётных записей кураторов и админ-кураторов платформы.
        </p>
      </section>

      <form onSubmit={handleSubmit} style={{ ...sectionStyle, display: 'grid', gap: 18 }}>
        <div style={gridStyle}>
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>

          <label className="field">
            <span>Отображаемое имя</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </label>

          <label className="field">
            <span>ФИО</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>

          <label className="field">
            <span>Должность</span>
            <input
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              placeholder="Например, специалист карьерного центра"
            />
          </label>

          <label className="field">
            <span>Пароль</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              minLength={8}
            />
          </label>

          <label className="field">
            <span>Роль</span>
            <select value={role} onChange={(event) => setRole(event.target.value as 'curator' | 'admin_curator')}>
              <option value="curator">Куратор</option>
              <option value="admin_curator">Админ-куратор</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Создаём…' : 'Создать куратора'}
          </button>
        </div>

        {success ? <p style={{ color: '#027a48', margin: 0 }}>{success}</p> : null}
        {createMutation.isError ? (
          <p style={{ color: '#b42318', margin: 0 }}>{getErrorMessage(createMutation.error)}</p>
        ) : null}
      </form>
    </div>
  );
}
