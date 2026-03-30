import { AxiosError } from 'axios';
import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
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

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isSafeRedirectPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path
          d="M3 12C4.8 8.8 8 6.5 12 6.5C16 6.5 19.2 8.8 21 12C19.2 15.2 16 17.5 12 17.5C8 17.5 4.8 15.2 3 12Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6 6.7C11.05 6.57 11.52 6.5 12 6.5C16 6.5 19.2 8.8 21 12C20.15 13.51 19.01 14.8 17.64 15.76"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.42 9.18C5.08 10.1 3.95 11.39 3 12C4.8 15.2 8 17.5 12 17.5C12.48 17.5 12.95 17.43 13.4 17.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.88 9.88C9.37 10.39 9.05 11.1 9.05 11.89C9.05 13.47 10.33 14.75 11.91 14.75C12.7 14.75 13.41 14.43 13.92 13.92"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const passwordWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
};

const passwordInputStyle: CSSProperties = {
  paddingRight: '56px',
};

const toggleButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  right: '14px',
  transform: 'translateY(-50%)',
  width: '32px',
  height: '32px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  color: '#6b7a90',
  zIndex: 2,
};

export function LoginPage() {
  const { login, user, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isBootstrapping || !user) return;
    navigate(resolveRedirectByRole(user.role), { replace: true });
  }, [isBootstrapping, navigate, user]);

  const redirectAfterLogin = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return isSafeRedirectPath(state?.from) ? state.from : null;
  }, [location.state]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setError('Введите email.');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const authUser = await login({ email: normalizedEmail, password });
      navigate(redirectAfterLogin ?? resolveRedirectByRole(authUser.role), { replace: true });
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

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              type="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              required
            />
          </label>

          <label className="field">
            <span>Пароль</span>
            <div style={passwordWrapStyle}>
              <input
                autoComplete="current-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Введите пароль"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError(null);
                }}
                required
                minLength={8}
                style={passwordInputStyle}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-pressed={showPassword}
                style={toggleButtonStyle}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
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
