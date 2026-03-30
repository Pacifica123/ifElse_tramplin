import { AxiosError } from 'axios';
import { CSSProperties, FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { paths } from '@/app/router/paths';
import type { UserRole } from '@/shared/types/common';

type RegisterRole = 'applicant' | 'employer';

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
      'Не удалось выполнить регистрацию.'
    );
  }

  return 'Не удалось выполнить регистрацию.';
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeDisplayName(value: string) {
  return value.replace(/\s+/g, ' ').trim();
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

export function RegisterPage() {
  const { register, user, isBootstrapping } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<RegisterRole>('applicant');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isBootstrapping || !user) return;
    navigate(resolveRedirectByRole(user.role), { replace: true });
  }, [isBootstrapping, navigate, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    const normalizedDisplayName = normalizeDisplayName(displayName);

    if (!normalizedDisplayName) {
      setError('Введите отображаемое имя.');
      return;
    }

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
      const authUser = await register({
        email: normalizedEmail,
        displayName: normalizedDisplayName,
        password,
        role,
      });
      navigate(resolveRedirectByRole(authUser.role), { replace: true });
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
          <p>Создайте аккаунт и сразу выберите роль, с которой будете работать на платформе.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Отображаемое имя</span>
            <input
              name="displayName"
              type="text"
              placeholder="Например, Иван Петров"
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                if (error) setError(null);
              }}
              required
              maxLength={120}
            />
          </label>

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
                autoComplete="new-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Минимум 8 символов"
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
        <div className="auth-hero__badge">Трамплин · регистрация</div>
        <h2>Создайте аккаунт и начните карьерный путь</h2>
        <p>
          Выберите роль при регистрации и получите доступ к подходящему сценарию работы: профилю
          соискателя или кабинету работодателя.
        </p>

        <div className="auth-hero__art" aria-hidden="true">
          <svg viewBox="0 0 560 340" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="registerFormCard" x1="130" y1="54" x2="430" y2="292" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#F7FAFF" />
              </linearGradient>
              <linearGradient id="registerPrimary" x1="152" y1="126" x2="264" y2="230" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4C7FFF" />
                <stop offset="1" stopColor="#6A5CFF" />
              </linearGradient>
              <linearGradient id="registerSecondary" x1="302" y1="124" x2="404" y2="214" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E7F3FF" />
                <stop offset="1" stopColor="#EFF7FF" />
              </linearGradient>
            </defs>

            <circle cx="90" cy="78" r="40" fill="#EAF1FF" />
            <circle cx="476" cy="278" r="54" fill="#EAF8F1" />

            <rect x="128" y="54" width="304" height="232" rx="30" fill="url(#registerFormCard)" stroke="#DCE5F4" strokeWidth="2" />
            <rect x="156" y="82" width="248" height="22" rx="11" fill="#EEF3FF" />
            <rect x="156" y="118" width="112" height="96" rx="24" fill="url(#registerPrimary)" />
            <rect x="284" y="118" width="120" height="96" rx="24" fill="url(#registerSecondary)" stroke="#D8E4F3" />

            <circle cx="212" cy="150" r="18" fill="rgba(255,255,255,0.24)" />
            <path d="M198 178C198 166.402 207.402 157 219 157H233C244.598 157 254 166.402 254 178V182H198V178Z" fill="rgba(255,255,255,0.26)" />
            <path d="M226 156C234.284 156 241 149.284 241 141C241 132.716 234.284 126 226 126C217.716 126 211 132.716 211 141C211 149.284 217.716 156 226 156Z" fill="rgba(255,255,255,0.35)" />
            <path d="M179 146H194" stroke="white" strokeWidth="6" strokeLinecap="round" />
            <path d="M186.5 138.5V153.5" stroke="white" strokeWidth="6" strokeLinecap="round" />

            <rect x="306" y="136" width="54" height="12" rx="6" fill="#BED5F6" />
            <rect x="306" y="158" width="74" height="12" rx="6" fill="#D6E6FB" />
            <rect x="306" y="180" width="44" height="12" rx="6" fill="#BED5F6" />
            <rect x="156" y="230" width="116" height="18" rx="9" fill="#EAF1FF" />
            <rect x="280" y="230" width="124" height="18" rx="9" fill="#EAF8F1" />

            <g transform="translate(44 220)">
              <rect x="0" y="0" width="132" height="88" rx="24" fill="#FFFFFF" stroke="#DCE5F4" strokeWidth="2" />
              <circle cx="30" cy="30" r="14" fill="#EAF1FF" />
              <path d="M24 30L28 34L36 26" stroke="#2F6FED" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="54" y="22" width="54" height="10" rx="5" fill="#C7D9FA" />
              <rect x="54" y="42" width="36" height="10" rx="5" fill="#E3ECFB" />
              <rect x="18" y="64" width="92" height="10" rx="5" fill="#EDF2FB" />
            </g>

            <g transform="translate(392 26)">
              <rect x="0" y="0" width="124" height="98" rx="24" fill="#FFFFFF" stroke="#DCE5F4" strokeWidth="2" />
              <rect x="18" y="18" width="40" height="40" rx="14" fill="#EAF8F1" />
              <path d="M30 44H46" stroke="#22A06B" strokeWidth="5" strokeLinecap="round" />
              <path d="M38 36V52" stroke="#22A06B" strokeWidth="5" strokeLinecap="round" />
              <rect x="68" y="22" width="34" height="10" rx="5" fill="#CFE5DA" />
              <rect x="68" y="42" width="28" height="10" rx="5" fill="#E5F3EC" />
              <rect x="18" y="70" width="84" height="10" rx="5" fill="#EEF5F9" />
            </g>
          </svg>
        </div>
      </aside>
    </section>
  );
}
