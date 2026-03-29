-- 005_verification_requests.sql

create type verification_request_status as enum (
    'pending',
    'approved',
    'rejected'
);

create table verification_requests (
    id bigserial primary key,
    employer_profile_id bigint not null unique references employer_profiles(id) on delete cascade,
    status verification_request_status not null default 'pending',
    comment text null,
    submitted_at timestamptz not null default now(),
    reviewed_at timestamptz null,
    reviewed_by_curator_id bigint null references users(id) on delete set null
);

create index verification_requests_status_idx
    on verification_requests (status);
