-- NOVIGO — SP1 : schéma d'identité de base (rôles, permissions, utilisateurs, refresh tokens).
-- Postgres 16 : gen_random_uuid() disponible nativement.

create table roles (
    id         uuid primary key default gen_random_uuid(),
    code       varchar(40)  not null unique,
    label      varchar(80)  not null,
    created_at timestamptz  not null default now()
);

create table permissions (
    id          uuid primary key default gen_random_uuid(),
    code        varchar(80)  not null unique,
    description varchar(160),
    created_at  timestamptz  not null default now()
);

create table role_permissions (
    role_id       uuid not null references roles(id)       on delete cascade,
    permission_id uuid not null references permissions(id) on delete cascade,
    primary key (role_id, permission_id)
);

create table users (
    id             uuid primary key default gen_random_uuid(),
    email          varchar(160) unique,
    phone          varchar(32)  unique,
    password_hash  varchar(120),
    full_name      varchar(160) not null,
    avatar_url     varchar(400),
    status         varchar(24)  not null default 'ACTIVE',
    email_verified boolean      not null default false,
    phone_verified boolean      not null default false,
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now()
);

create table user_roles (
    user_id uuid not null references users(id) on delete cascade,
    role_id uuid not null references roles(id) on delete cascade,
    primary key (user_id, role_id)
);

create table refresh_tokens (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid        not null references users(id) on delete cascade,
    token_hash varchar(120) not null unique,
    expires_at timestamptz  not null,
    revoked    boolean      not null default false,
    created_at timestamptz  not null default now()
);
create index idx_refresh_tokens_user on refresh_tokens(user_id);
create index idx_users_status on users(status);
