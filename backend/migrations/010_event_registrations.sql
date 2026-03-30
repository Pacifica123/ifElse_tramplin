-- 010_event_registrations.sql

create type event_registration_status as enum (
    'registered',
    'cancelled'
);

create table event_registrations (
    id bigserial primary key,
    opportunity_id bigint not null references opportunities(id) on delete cascade,
    applicant_profile_id bigint not null references applicant_profiles(id) on delete cascade,
    status event_registration_status not null default 'registered',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    cancelled_at timestamptz null,

    constraint event_registrations_unique_opportunity_applicant
        unique (opportunity_id, applicant_profile_id)
);

create index event_registrations_applicant_profile_id_idx
    on event_registrations (applicant_profile_id, created_at desc);

create index event_registrations_opportunity_id_idx
    on event_registrations (opportunity_id, created_at desc);

create index event_registrations_status_idx
    on event_registrations (status);

create trigger trg_event_registrations_set_updated_at
before update on event_registrations
for each row
execute function set_updated_at();
