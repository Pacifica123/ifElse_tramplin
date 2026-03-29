-- 003_catalog_core.sql

create type opportunity_type as enum (
    'internship',
    'vacancy',
    'mentoring',
    'event'
);

create type work_format as enum (
    'office',
    'hybrid',
    'remote'
);

create type employment_type as enum (
    'full_time',
    'part_time',
    'project'
);

create type level as enum (
    'intern',
    'junior',
    'middle',
    'senior'
);

create type publication_status as enum (
    'draft',
    'pending_moderation',
    'active',
    'planned',
    'closed',
    'rejected'
);

create type tag_type as enum (
    'technology',
    'level',
    'employment',
    'category'
);

create table cities (
    id bigserial primary key,
    country text null,
    region text null,
    city_name text not null,
    latitude double precision null,
    longitude double precision null,
    created_at timestamptz not null default now(),

    constraint cities_city_name_not_blank
        check (length(trim(city_name)) > 0)
);

create unique index cities_city_name_lower_uidx
    on cities (lower(city_name));

create table addresses (
    id bigserial primary key,
    city_id bigint not null references cities(id) on delete restrict,
    full_address text not null,
    latitude double precision null,
    longitude double precision null,
    created_at timestamptz not null default now(),

    constraint addresses_full_address_not_blank
        check (length(trim(full_address)) > 0)
);

create table tags (
    id bigserial primary key,
    name text not null,
    tag_type tag_type not null,
    created_by_user_id bigint null references users(id) on delete set null,
    is_system boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),

    constraint tags_name_not_blank
        check (length(trim(name)) > 0)
);

create unique index tags_name_type_lower_uidx
    on tags (lower(name), tag_type);

create table opportunities (
    id bigserial primary key,
    employer_profile_id bigint not null references employer_profiles(id) on delete cascade,

    title text not null,
    short_description text null,
    full_description text null,

    opportunity_type opportunity_type not null,
    work_format work_format not null,
    employment_type employment_type null,
    level level null,
    publication_status publication_status not null default 'draft',

    city_id bigint null references cities(id) on delete restrict,
    address_id bigint null references addresses(id) on delete restrict,

    salary_from integer null,
    salary_to integer null,

    published_at timestamptz null,
    expires_at timestamptz null,
    event_date timestamptz null,

    contact_info jsonb not null default '{}'::jsonb,
    resource_links jsonb not null default '[]'::jsonb,
    media jsonb not null default '[]'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint opportunities_title_not_blank
        check (length(trim(title)) > 0),

    constraint opportunities_salary_from_non_negative
        check (salary_from is null or salary_from >= 0),

    constraint opportunities_salary_to_non_negative
        check (salary_to is null or salary_to >= 0),

    constraint opportunities_salary_range_chk
        check (salary_from is null or salary_to is null or salary_from <= salary_to),

    constraint opportunities_location_chk
        check (
            (work_format = 'remote' and city_id is not null)
            or
            (work_format in ('office', 'hybrid') and address_id is not null)
        ),

    constraint opportunities_time_window_chk
        check (
            (opportunity_type = 'event' and event_date is not null)
            or
            (opportunity_type in ('vacancy', 'internship', 'mentoring') and expires_at is not null)
        )
);

create index opportunities_public_catalog_idx
    on opportunities (publication_status, opportunity_type, work_format, created_at desc);

create index opportunities_employer_profile_id_idx
    on opportunities (employer_profile_id);

create index opportunities_city_id_idx
    on opportunities (city_id);

create index opportunities_address_id_idx
    on opportunities (address_id);

create trigger trg_opportunities_set_updated_at
before update on opportunities
for each row
execute function set_updated_at();

create table opportunity_tags (
    opportunity_id bigint not null references opportunities(id) on delete cascade,
    tag_id bigint not null references tags(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (opportunity_id, tag_id)
);

create index opportunity_tags_tag_id_idx
    on opportunity_tags (tag_id);
