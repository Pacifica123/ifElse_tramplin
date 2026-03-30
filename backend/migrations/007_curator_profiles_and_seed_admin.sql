-- 007_curator_profiles_and_seed_admin.sql

create table curator_profiles (
    id bigserial primary key,
    user_id bigint not null unique references users(id) on delete cascade,
    full_name text not null,
    position text null,
    created_at timestamptz not null default now(),

    constraint curator_profiles_full_name_not_blank
        check (length(trim(full_name)) > 0)
);

insert into users (email, display_name, password_hash, role)
values (
    'admin@trampolin.local',
    'Platform Admin',
    '$argon2id$v=19$m=65536,t=3,p=4$Efv2mqZ8faD7zBlL/gRvOw$6Yy8wdFmUpMTPjizmTEcpOE/YfjMjmN/a9gTCi7Xd9o',
    'admin_curator'
);

insert into curator_profiles (user_id, full_name, position)
select id, 'Platform Administrator', 'System Administrator'
from users
where lower(email) = 'admin@trampolin.local';
