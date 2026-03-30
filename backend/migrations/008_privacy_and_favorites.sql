-- ===== privacy settings =====

create table privacy_settings (
    id bigserial primary key,
    applicant_profile_id bigint not null unique references applicant_profiles(id) on delete cascade,

    resume_visible_to_contacts boolean not null default false,
    resume_visible_to_all_auth boolean not null default false,
    applications_visible_to_contacts boolean not null default false,
    applications_visible_to_all_auth boolean not null default false,
    profile_visible_to_all_auth boolean not null default true,

    updated_at timestamptz not null default now()
);

create trigger trg_privacy_settings_set_updated_at
before update on privacy_settings
for each row
execute function set_updated_at();

-- ===== favorites =====

create table favorite_opportunities (
    user_id bigint not null references users(id) on delete cascade,
    opportunity_id bigint not null references opportunities(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, opportunity_id)
);

create table favorite_employers (
    user_id bigint not null references users(id) on delete cascade,
    employer_profile_id bigint not null references employer_profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, employer_profile_id)
);

create index favorite_opportunities_user_id_idx
    on favorite_opportunities (user_id);

create index favorite_employers_user_id_idx
    on favorite_employers (user_id);