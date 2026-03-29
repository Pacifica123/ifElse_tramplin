export function LoginShowcase() {
  return (
    <aside className="login-showcase" aria-label="Иллюстрация платформы">
      <div className="login-showcase__eyebrow">Трамплин</div>
      <h2>Карта возможностей для старта карьеры</h2>
      <p>
        Стажировки, вакансии, мероприятия и менторские программы в одном интерфейсе.
      </p>

      <div className="login-showcase__stats">
        <div className="login-showcase__stat">
          <strong>4</strong>
          <span>роли уже готовы</span>
        </div>
        <div className="login-showcase__stat">
          <strong>2</strong>
          <span>режима отображения</span>
        </div>
        <div className="login-showcase__stat">
          <strong>1</strong>
          <span>единая точка входа</span>
        </div>
      </div>

      <div className="login-showcase__art">
        <svg viewBox="0 0 560 420" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="cardGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#dbe8ff" stopOpacity="0.78" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>

          <rect x="22" y="26" width="516" height="368" rx="32" fill="rgba(255,255,255,0.08)" />
          <rect x="42" y="50" width="300" height="292" rx="26" fill="url(#cardGradient)" />
          <rect x="360" y="74" width="148" height="112" rx="22" fill="url(#cardGradient)" />
          <rect x="360" y="208" width="148" height="104" rx="22" fill="url(#cardGradient)" />

          <path
            d="M86 282C138 220 151 126 218 110C270 97 311 132 311 189C311 260 246 311 166 311C133 311 106 301 86 282Z"
            fill="#e8f0ff"
          />
          <path d="M105 176L160 136L208 183L247 143L289 193" fill="none" stroke="#8db3ff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M104 223L155 252L219 207L279 241" fill="none" stroke="#4f46e5" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />

          <circle cx="160" cy="136" r="13" fill="#0f172a" />
          <circle cx="208" cy="183" r="13" fill="#0f172a" />
          <circle cx="247" cy="143" r="13" fill="#0f172a" />
          <circle cx="155" cy="252" r="13" fill="#38bdf8" />
          <circle cx="219" cy="207" r="13" fill="#38bdf8" />
          <circle cx="279" cy="241" r="13" fill="#38bdf8" />

          <g transform="translate(378 92)">
            <rect width="112" height="76" rx="18" fill="#eef4ff" />
            <rect x="16" y="16" width="40" height="40" rx="14" fill="url(#accentGradient)" />
            <circle cx="36" cy="36" r="10" fill="white" />
            <rect x="68" y="18" width="28" height="10" rx="5" fill="#1e3a8a" opacity="0.88" />
            <rect x="68" y="35" width="22" height="8" rx="4" fill="#64748b" opacity="0.9" />
            <rect x="68" y="50" width="30" height="8" rx="4" fill="#64748b" opacity="0.65" />
          </g>

          <g transform="translate(378 224)">
            <rect width="112" height="68" rx="18" fill="#eef4ff" />
            <path d="M24 46C33 27 48 16 61 16C73 16 83 25 88 38" fill="none" stroke="#4f46e5" strokeWidth="8" strokeLinecap="round" />
            <circle cx="29" cy="48" r="10" fill="#22c55e" />
            <circle cx="61" cy="18" r="10" fill="#38bdf8" />
            <circle cx="89" cy="40" r="10" fill="#f59e0b" />
          </g>

          <g transform="translate(96 300)">
            <rect width="170" height="26" rx="13" fill="#ffffff" opacity="0.92" />
            <rect x="12" y="8" width="56" height="10" rx="5" fill="#2563eb" opacity="0.9" />
            <rect x="78" y="8" width="34" height="10" rx="5" fill="#94a3b8" />
            <rect x="120" y="8" width="38" height="10" rx="5" fill="#94a3b8" opacity="0.75" />
          </g>
        </svg>
      </div>
    </aside>
  );
}
