-- 006_applications.sql

create type application_status as enum (
    'pending',
    'accepted',
    'rejected',
    'reserve'
);

create table applications (
    id bigserial primary key,
    opportunity_id bigint not null references opportunities(id) on delete cascade,
    applicant_profile_id bigint not null references applicant_profiles(id) on delete cascade,
    status application_status not null default 'pending',
    cover_letter text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint applications_cover_letter_len_chk
        check (cover_letter is null or char_length(cover_letter) <= 5000),

    constraint applications_unique_opportunity_applicant
        unique (opportunity_id, applicant_profile_id)
);

create index applications_applicant_profile_id_idx
    on applications (applicant_profile_id, created_at desc);

create index applications_opportunity_id_idx
    on applications (opportunity_id, created_at desc);

create index applications_status_idx
    on applications (status);

create trigger trg_applications_set_updated_at
before update on applications
for each row
execute function set_updated_at();
