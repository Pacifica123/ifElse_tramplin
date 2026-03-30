create type contact_status as enum (
    'pending',
    'accepted',
    'rejected',
    'blocked'
);

create table contacts (
    id bigserial primary key,
    requester_user_id bigint not null references users(id) on delete cascade,
    addressee_user_id bigint not null references users(id) on delete cascade,
    status contact_status not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint contacts_not_self_chk
        check (requester_user_id <> addressee_user_id)
);

create unique index contacts_pair_uidx
    on contacts (
        least(requester_user_id, addressee_user_id),
        greatest(requester_user_id, addressee_user_id)
    );

create index contacts_requester_idx
    on contacts (requester_user_id);

create index contacts_addressee_idx
    on contacts (addressee_user_id);

create trigger trg_contacts_set_updated_at
before update on contacts
for each row
execute function set_updated_at();