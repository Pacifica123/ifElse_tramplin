import { AxiosError } from 'axios';
import { FormEvent, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { paths } from '@/app/router/paths';
import type { UserRole } from '@/shared/types/common';

function resolveRedirectByRole(role: UserRole) {
  switch (role) {
    case 'applicant':
      return paths.applicantProfile;
    case 'employer':
      return paths.employerProfile;
    case 'curator':
      return paths.curatorDashboard;
    case 'admin_curator':
      return paths.adminCurators;
    default:
      return paths.home;
  }
}

function readApiError(error: unknown) {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      error.message ??
      'Не удалось выполнить вход.'
    );
  }

  return 'Не удалось выполнить вход.';
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectAfterLogin = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from;
  }, [location.state]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      navigate(redirectAfterLogin ?? resolveRedirectByRole(user.role), { replace: true });
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
          <h1>Вход в систему</h1>
          <p>Форма уже подключена к backend: register/login/me работают через текущий API.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              name="password"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>

          {error ? <div className="auth-alert auth-alert--error">{error}</div> : null}

          <button className="btn auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <div className="auth-help">
          <span>Нет аккаунта?</span>
          <button className="btn btn--secondary" type="button" onClick={() => navigate(paths.register)}>
            Перейти к регистрации
          </button>
        </div>
      </div>

      <aside className="auth-hero auth-hero--login">
        <div className="auth-hero__badge">Трамплин · backend auth</div>
        <h2>Один вход для ролей платформы</h2>
        <p>
          После логина фронт получает accessToken и user.role, а дальше маршрутизация идет по роли
          пользователя через <code>/api/v1/me</code>.
        </p>
        <ul className="auth-points">
          <li>соискатель → ЛК соискателя</li>
          <li>работодатель → ЛК работодателя</li>
          <li>куратор → панель куратора</li>
        </ul>
      </aside>
    </section>
  );
}
