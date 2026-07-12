-- V9 : Fidélité NOVIGO (points + registre) & seed de coupons de démo.
-- Schéma finance (Postgres 16). PK uuid via gen_random_uuid(), points en integer.

create table loyalty_accounts (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid        not null unique,
    points     integer     not null default 0,
    tier       varchar(16) not null default 'BRONZE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table loyalty_ledger (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid         not null,
    delta      integer      not null,
    label      varchar(160) not null,
    created_at timestamptz  not null default now()
);
create index idx_loyalty_ledger_user on loyalty_ledger (user_id, created_at desc);

-- Compte de démonstration : client seedé (+22371000000), palier Argent, 1 240 pts.
insert into loyalty_accounts (user_id, points, tier) values
    ('f9c5dd02-db59-4e42-99ba-9a9bbf39923e', 1240, 'SILVER')
    on conflict (user_id) do nothing;

insert into loyalty_ledger (user_id, delta, label, created_at) values
    ('f9c5dd02-db59-4e42-99ba-9a9bbf39923e',  43, 'Commande Aux Trois Fleuves',        now() - interval '2 hour'),
    ('f9c5dd02-db59-4e42-99ba-9a9bbf39923e',  65, 'Commande Pharmacie du Point G',      now() - interval '1 day'),
    ('f9c5dd02-db59-4e42-99ba-9a9bbf39923e', -200, 'Échange · Livraison offerte',       now() - interval '3 day'),
    ('f9c5dd02-db59-4e42-99ba-9a9bbf39923e', 250, 'Bonus parrainage',                   now() - interval '5 day');

-- Coupons de démonstration (visibles dans l'app client via /api/v1/coupons).
insert into coupons (code, label, discount_percent, min_amount, active, expires_at) values
    ('MALI10',     '-10% sur votre commande', 10, 5000, true, now() + interval '30 day'),
    ('LIVRAISON0', 'Livraison offerte',        0,    0, true, now() + interval '20 day'),
    ('WEEKEND15',  '-15% le week-end',        15, 8000, true, now() + interval '28 day')
    on conflict (code) do nothing;
