-- 001_init_core.sql

-- ===== enums =====

create type app_role as enum (
    'applicant',
    'employer',
    'curator',
    'admin_curator'
);

create type employer_verification_status as enum (
    'pending',
    'verified',
    'rejected'
);

-- ===== common updated_at trigger =====

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- ===== users =====

create table users (
    id bigserial primary key,
    email text not null,
    display_name text not null,
    password_hash text not null,
    role app_role not null,
    is_active boolean not null default true,
    last_login_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint users_email_not_blank
        check (length(trim(email)) > 3),

    constraint users_display_name_not_blank
        check (length(trim(display_name)) > 0),

    constraint users_password_hash_not_blank
        check (length(trim(password_hash)) > 0)
);

create unique index users_email_lower_uidx
    on users (lower(email));

create trigger trg_users_set_updated_at
before update on users
for each row
execute function set_updated_at();

-- ===== applicant_profiles =====

create table applicant_profiles (
    id bigserial primary key,
    user_id bigint not null unique references users(id) on delete cascade,

    full_name text null,
    university text null,
    study_course text null,
    graduation_year integer null,
    about text null,
    resume_text text null,

    portfolio_links jsonb not null default '[]'::jsonb,
    skills jsonb not null default '[]'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint applicant_profiles_graduation_year_chk
        check (graduation_year is null or graduation_year between 2000 and 2100)
);

create trigger trg_applicant_profiles_set_updated_at
before update on applicant_profiles
for each row
execute function set_updated_at();

-- ===== employer_profiles =====

create table employer_profiles (
    id bigserial primary key,
    user_id bigint not null unique references users(id) on delete cascade,

    company_name text null,
    short_description text null,
    industry text null,
    website_url text null,

    social_links jsonb not null default '[]'::jsonb,
    office_photos jsonb not null default '[]'::jsonb,
    promo_video_url text null,

    city_name text null,

    verification_status employer_verification_status not null default 'pending',
    verification_comment text null,
    verified_at timestamptz null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger trg_employer_profiles_set_updated_at
before update on employer_profiles
for each row
execute function set_updated_at();

-- ===== refresh_tokens =====

create table refresh_tokens (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,

    token_hash text not null,
    expires_at timestamptz not null,
    revoked_at timestamptz null,

    user_agent text null,
    ip_address inet null,

    created_at timestamptz not null default now(),

    constraint refresh_tokens_token_hash_not_blank
        check (length(trim(token_hash)) > 0)
);

create unique index refresh_tokens_token_hash_uidx
    on refresh_tokens (token_hash);

create index refresh_tokens_user_id_idx
    on refresh_tokens (user_id);

create index refresh_tokens_expires_at_idx
    on refresh_tokens (expires_at);