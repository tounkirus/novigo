-- NOVIGO — SP5 : paiements modulaires + fournisseurs activables.
create table payment_providers (
    id         uuid primary key default gen_random_uuid(),
    code       varchar(24)  not null unique,
    label      varchar(80)  not null,
    enabled    boolean      not null default true,
    sort_order integer      not null default 0,
    fee_bps    integer      not null default 0,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now()
);

create table payments (
    id             uuid primary key default gen_random_uuid(),
    ref            varchar(24)  not null unique,
    provider       varchar(24)  not null,
    purpose        varchar(24)  not null default 'RECHARGE',
    amount         bigint       not null,
    currency       varchar(8)   not null default 'XOF',
    status         varchar(24)  not null default 'PENDING',
    payer_id       uuid,
    wallet_id      uuid,
    target_type    varchar(24),
    target_id      uuid,
    external_ref   varchar(80),
    commission     bigint       not null default 0,
    failure_reason varchar(240),
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now()
);
create index idx_payments_payer on payments(payer_id);
create index idx_payments_status on payments(status);
create index idx_payments_target on payments(target_type, target_id);

-- Fournisseurs par défaut (activables/désactivables ensuite via l'API admin).
insert into payment_providers (code, label, enabled, sort_order, fee_bps) values
    ('ORANGE_MONEY', 'Orange Money', true,  1, 150),
    ('WAVE',         'Wave',         true,  2, 100),
    ('MOOV_MONEY',   'Moov Money',   true,  3, 150),
    ('STRIPE',       'Carte bancaire (Stripe)', true, 4, 290),
    ('CASH',         'Espèces',      true,  5, 0)
on conflict (code) do nothing;
