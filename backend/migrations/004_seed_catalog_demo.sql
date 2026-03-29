-- 004_seed_catalog_demo.sql

insert into cities (country, region, city_name, latitude, longitude)
values
    ('Russia', 'Tomsk Oblast', 'Tomsk', 56.4846, 84.9486),
    ('Russia', 'Moscow', 'Moscow', 55.7558, 37.6173);

insert into addresses (city_id, full_address, latitude, longitude)
select c.id, 'Tomsk, Lenina Ave, 30', 56.4910, 84.9530
from cities c
where lower(c.city_name) = 'tomsk';

insert into users (email, display_name, password_hash, role)
values ('seed_demo_employer@example.com', 'Seed Demo Employer', 'seed-demo-password-hash', 'employer');

insert into employer_profiles (
    user_id,
    company_name,
    short_description,
    industry,
    website_url,
    social_links,
    office_photos,
    promo_video_url,
    city_id,
    verification_status,
    verification_comment,
    verified_at
)
select
    u.id,
    'CodeInsight Labs',
    'Команда, которая запускает стажировки и карьерные мероприятия для junior-разработчиков.',
    'EdTech / HR Tech',
    'https://example.com',
    '["https://t.me/codeinsight"]'::jsonb,
    '[]'::jsonb,
    null,
    c.id,
    'verified',
    'Seed employer for public catalog smoke tests',
    now()
from users u
cross join cities c
where lower(u.email) = 'seed_demo_employer@example.com'
  and lower(c.city_name) = 'tomsk';

insert into tags (name, tag_type, is_system, is_active)
values
    ('Rust', 'technology', true, true),
    ('SQL', 'technology', true, true),
    ('Junior', 'level', true, true),
    ('Intern', 'level', true, true),
    ('Full-time', 'employment', true, true),
    ('Part-time', 'employment', true, true),
    ('Backend', 'category', true, true),
    ('Event', 'category', true, true);

insert into opportunities (
    employer_profile_id,
    title,
    short_description,
    full_description,
    opportunity_type,
    work_format,
    employment_type,
    level,
    publication_status,
    city_id,
    address_id,
    salary_from,
    salary_to,
    published_at,
    expires_at,
    event_date,
    contact_info,
    resource_links,
    media
)
select
    ep.id,
    'Rust Backend Intern',
    'Стажировка для студентов, которые хотят писать backend на Rust и SQLx.',
    'Нужны базовые знания Rust, HTTP API и SQL. Будете помогать развивать модуль карьеры, каталог возможностей и фильтрацию.',
    'internship',
    'remote',
    'part_time',
    'intern',
    'active',
    c.id,
    null,
    30000,
    50000,
    now() - interval '2 days',
    now() + interval '30 days',
    null,
    '{"email":"internships@example.com","telegram":"@codeinsight_hr","contactPerson":"HR Team"}'::jsonb,
    '["https://example.com/internship"]'::jsonb,
    '[]'::jsonb
from employer_profiles ep
join cities c on lower(c.city_name) = 'tomsk'
where ep.company_name = 'CodeInsight Labs';

insert into opportunities (
    employer_profile_id,
    title,
    short_description,
    full_description,
    opportunity_type,
    work_format,
    employment_type,
    level,
    publication_status,
    city_id,
    address_id,
    salary_from,
    salary_to,
    published_at,
    expires_at,
    event_date,
    contact_info,
    resource_links,
    media
)
select
    ep.id,
    'Career Meetup for Junior Developers',
    'Очное карьерное мероприятие с работодателями и менторами.',
    'На мероприятии будут разборы резюме, мини-собеседования и презентации стажировок от компаний-партнеров.',
    'event',
    'office',
    null,
    'junior',
    'active',
    null,
    a.id,
    null,
    null,
    now() - interval '1 day',
    null,
    now() + interval '14 days',
    '{"email":"events@example.com","phone":"+7-999-000-00-00","contactPerson":"Event Team"}'::jsonb,
    '["https://example.com/meetup"]'::jsonb,
    '[]'::jsonb
from employer_profiles ep
join addresses a on a.full_address = 'Tomsk, Lenina Ave, 30'
where ep.company_name = 'CodeInsight Labs';

insert into opportunity_tags (opportunity_id, tag_id)
select o.id, t.id
from opportunities o
join tags t on t.name in ('Rust', 'Backend', 'Intern', 'Part-time')
where o.title = 'Rust Backend Intern';

insert into opportunity_tags (opportunity_id, tag_id)
select o.id, t.id
from opportunities o
join tags t on t.name in ('Event', 'Junior')
where o.title = 'Career Meetup for Junior Developers';
