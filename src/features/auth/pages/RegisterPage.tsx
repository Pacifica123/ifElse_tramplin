import { AxiosError } from 'axios';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { paths } from '@/app/router/paths';

type RegisterRole = 'applicant' | 'employer';

function readApiError(error: unknown) {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      error.message ??
      'Не удалось выполнить регистрацию.'
    );
  }

  return 'Не удалось выполнить регистрацию.';
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RegisterRole>('applicant');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await register({ email, displayName, password, role });
      navigate(user.role === 'employer' ? paths.employerProfile : paths.applicantProfile, {
        replace: true,
      });
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1>Регистрация</h1>
          <p>Сейчас backend поддерживает регистрацию ролей «соискатель» и «работодатель».</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Отображаемое имя</span>
            <input
              name="displayName"
              type="text"
              placeholder="Например, Иван Петров"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Пароль</span>
            <input
              autoComplete="new-password"
              name="password"
              type="password"
              placeholder="Минимум 8 символов"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>

          <fieldset className="role-switcher">
            <legend>Роль при регистрации</legend>
            <label>
              <input
                type="radio"
                name="role"
                value="applicant"
                checked={role === 'applicant'}
                onChange={() => setRole('applicant')}
              />
              <span>Соискатель</span>
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="employer"
                checked={role === 'employer'}
                onChange={() => setRole('employer')}
              />
              <span>Работодатель</span>
            </label>
          </fieldset>

          {error ? <div className="auth-alert auth-alert--error">{error}</div> : null}

          <button className="btn auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Регистрируем...' : 'Создать аккаунт'}
          </button>
        </form>
      </div>

      <aside className="auth-hero auth-hero--register">
        <div className="auth-hero__badge">Трамплин · register</div>
        <h2>Регистрация уже завязана на backend</h2>
        <p>
          После успешной регистрации backend сразу возвращает токены и пользователя, поэтому можно
          сразу перевести человека в нужный личный кабинет.
        </p>
        <ul className="auth-points">
          <li>роль выбирается на форме</li>
          <li>profile-заготовка создается на сервере автоматически</li>
          <li>после этого можно сразу открывать ЛК</li>
        </ul>
      </aside>
    </section>
  );
}
