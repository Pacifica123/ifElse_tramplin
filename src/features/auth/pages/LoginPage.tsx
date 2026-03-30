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
          <p>Войдите в систему, чтобы попасть в свой личный кабинет.</p>
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
        <div className="auth-hero__badge">Трамплин · вход</div>
        <h2>Платформа для старта карьеры в IT</h2>
        <p>
          Находите стажировки, вакансии, карьерные мероприятия и менторские программы. Один аккаунт дает доступ к личному кабинету, откликам и возможностям платформы.
        </p>

        <div className="auth-hero__art" aria-hidden="true">
          <svg viewBox="0 0 560 340" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="heroCard" x1="116" y1="64" x2="443" y2="302" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#F4F7FF" />
              </linearGradient>
              <linearGradient id="heroAccent" x1="109" y1="84" x2="409" y2="302" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4C7FFF" />
                <stop offset="1" stopColor="#6A5CFF" />
              </linearGradient>
              <linearGradient id="heroAccentSoft" x1="292" y1="194" x2="492" y2="304" gradientUnits="userSpaceOnUse">
                <stop stopColor="#DFF3FF" />
                <stop offset="1" stopColor="#EEF6FF" />
              </linearGradient>
            </defs>

            <circle cx="82" cy="76" r="42" fill="#E8F0FF" />
            <circle cx="478" cy="282" r="54" fill="#EAF8F1" />

            <rect x="108" y="56" width="336" height="224" rx="28" fill="url(#heroCard)" stroke="#DCE5F4" strokeWidth="2" />
            <rect x="136" y="84" width="280" height="24" rx="12" fill="#EFF4FF" />
            <rect x="136" y="124" width="126" height="92" rx="22" fill="url(#heroAccent)" />
            <rect x="278" y="124" width="138" height="92" rx="22" fill="url(#heroAccentSoft)" stroke="#D8E4F3" />
            <rect x="136" y="232" width="280" height="20" rx="10" fill="#EDF2FB" />

            <rect x="314" y="140" width="66" height="12" rx="6" fill="#BFD6F6" />
            <rect x="314" y="162" width="86" height="12" rx="6" fill="#D1E2FA" />
            <rect x="314" y="184" width="54" height="12" rx="6" fill="#BFD6F6" />

            <circle cx="198" cy="156" r="22" fill="rgba(255,255,255,0.26)" />
            <path d="M198 182C213.464 182 226 169.464 226 154C226 138.536 213.464 126 198 126C182.536 126 170 138.536 170 154C170 169.464 182.536 182 198 182Z" fill="rgba(255,255,255,0.18)" />
            <path d="M189 154L196 161L210 147" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

            <g transform="translate(42 198)">
              <rect x="0" y="0" width="112" height="86" rx="22" fill="#FFFFFF" stroke="#DCE5F4" strokeWidth="2" />
              <circle cx="33" cy="31" r="14" fill="#EAF1FF" />
              <rect x="56" y="22" width="36" height="10" rx="5" fill="#C7D9FA" />
              <rect x="20" y="56" width="72" height="10" rx="5" fill="#EDF2FB" />
            </g>

            <g transform="translate(392 26)">
              <rect x="0" y="0" width="120" height="92" rx="24" fill="#FFFFFF" stroke="#DCE5F4" strokeWidth="2" />
              <path d="M38 58C47.9411 58 56 49.9411 56 40C56 30.0589 47.9411 22 38 22C28.0589 22 20 30.0589 20 40C20 49.9411 28.0589 58 38 58Z" fill="#3B82F6" fillOpacity="0.15" />
              <path d="M37.998 28C31.923 28 27 32.923 27 39C27 46.8 37.998 58 37.998 58C37.998 58 49 46.8 49 39C49 32.923 44.073 28 37.998 28ZM37.998 44C35.237 44 33 41.761 33 39C33 36.239 35.237 34 37.998 34C40.761 34 43 36.239 43 39C43 41.761 40.761 44 37.998 44Z" fill="#2F6FED" />
              <rect x="66" y="28" width="34" height="10" rx="5" fill="#C7D9FA" />
              <rect x="66" y="48" width="24" height="10" rx="5" fill="#E3ECFB" />
            </g>
          </svg>
        </div>
      </aside>
    </section>
  );
}
