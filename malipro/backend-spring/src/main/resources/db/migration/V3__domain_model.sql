-- NOVIGO — SP2 : modèle de domaine complet (géo, catalogue, commerce, wallet, cash, services, plateforme).
-- Postgres 16. Toutes les PK en uuid via gen_random_uuid(). Montants en bigint (centimes/XOF entier).

-- ============================ GÉO ============================
create table countries (
    id         uuid primary key default gen_random_uuid(),
    code       varchar(2)  not null unique,
    name       varchar(80) not null,
    dial_code  varchar(8),
    currency   varchar(8),
    created_at timestamptz not null default now()
);

create table cities (
    id         uuid primary key default gen_random_uuid(),
    name       varchar(120) not null,
    country_id uuid references countries(id) on delete set null,
    lat        double precision,
    lng        double precision,
    created_at timestamptz  not null default now()
);
create index idx_cities_country on cities(country_id);

create table delivery_zones (
    id         uuid primary key default gen_random_uuid(),
    name       varchar(120) not null,
    city_id    uuid references cities(id) on delete set null,
    active     boolean      not null default true,
    base_fee   bigint       not null default 0,
    created_at timestamptz  not null default now()
);
create index idx_delivery_zones_city on delivery_zones(city_id);

-- ============================ CATALOGUE ============================
create table categories (
    id         uuid primary key default gen_random_uuid(),
    code       varchar(60) not null unique,
    label      varchar(80) not null,
    icon       varchar(60),
    vertical   varchar(40),
    created_at timestamptz not null default now()
);

create table stores (
    id                uuid primary key default gen_random_uuid(),
    slug              varchar(160) not null unique,
    name              varchar(160) not null,
    category          varchar(40)  not null,
    owner_id          uuid references users(id) on delete set null,
    city_id           uuid references cities(id) on delete set null,
    district          varchar(120),
    address           varchar(240),
    phone             varchar(32),
    lat               double precision,
    lng               double precision,
    rating            numeric(3,2),
    review_count      integer      not null default 0,
    is_open           boolean      not null default true,
    delivery_fee      bigint       not null default 0,
    delivery_time_min integer      not null default 0,
    cover_url         varchar(400),
    logo_url          varchar(400),
    status            varchar(24)  not null default 'APPROVED',
    created_at        timestamptz  not null default now(),
    updated_at        timestamptz  not null default now()
);
create index idx_stores_category on stores(category);
create index idx_stores_owner on stores(owner_id);

create table restaurants (
    id         uuid primary key default gen_random_uuid(),
    store_id   uuid not null unique references stores(id) on delete cascade,
    cuisine    varchar(120),
    halal      boolean not null default true,
    avg_price  bigint  not null default 0,
    created_at timestamptz not null default now()
);

create table products (
    id             uuid primary key default gen_random_uuid(),
    store_id       uuid not null references stores(id) on delete cascade,
    category_id    uuid references categories(id) on delete set null,
    name           varchar(160) not null,
    description    varchar(2000),
    price          bigint       not null default 0,
    old_price      bigint,
    image_url      varchar(400),
    available      boolean      not null default true,
    is_best_seller boolean      not null default false,
    is_new         boolean      not null default false,
    stock          integer      not null default 0,
    menu_section   varchar(80),
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now()
);
create index idx_products_store on products(store_id);
create index idx_products_category on products(category_id);

-- ============================ LOGISTIQUE ============================
create table vehicles (
    id         uuid primary key default gen_random_uuid(),
    type       varchar(24) not null default 'MOTO',
    plate      varchar(40),
    model      varchar(80),
    color      varchar(40),
    created_at timestamptz not null default now()
);

create table drivers (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid unique references users(id) on delete set null,
    vehicle_id       uuid references vehicles(id) on delete set null,
    status           varchar(24) not null default 'OFFLINE',
    kyc_status       varchar(24) not null default 'PENDING',
    current_lat      double precision,
    current_lng      double precision,
    rating           numeric(3,2) default 0,
    total_deliveries integer     not null default 0,
    available        boolean     not null default false,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

-- ============================ COMMERCE ============================
create table orders (
    id             uuid primary key default gen_random_uuid(),
    ref            varchar(24) not null unique,
    customer_id    uuid references users(id) on delete set null,
    store_id       uuid references stores(id) on delete set null,
    driver_id      uuid references drivers(id) on delete set null,
    status         varchar(24) not null default 'PENDING',
    subtotal       bigint      not null default 0,
    delivery_fee   bigint      not null default 0,
    total          bigint      not null default 0,
    payment_method varchar(24),
    payment_status varchar(24) default 'PENDING',
    address        varchar(240),
    district       varchar(120),
    placed_at      timestamptz,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_store on orders(store_id);
create index idx_orders_driver on orders(driver_id);
create index idx_orders_status on orders(status);

create table order_items (
    id            uuid primary key default gen_random_uuid(),
    order_id      uuid not null references orders(id) on delete cascade,
    product_id    uuid references products(id) on delete set null,
    name          varchar(160) not null,
    unit_price    bigint  not null default 0,
    quantity      integer not null default 1,
    options_label varchar(240),
    created_at    timestamptz not null default now()
);
create index idx_order_items_order on order_items(order_id);

create table coupons (
    id               uuid primary key default gen_random_uuid(),
    code             varchar(40)  not null unique,
    label            varchar(120),
    discount_percent integer      not null default 0,
    min_amount       bigint       not null default 0,
    active           boolean      not null default true,
    expires_at       timestamptz,
    created_at       timestamptz  not null default now()
);

create table reviews (
    id          uuid primary key default gen_random_uuid(),
    author_id   uuid references users(id) on delete set null,
    target_type varchar(24) not null default 'STORE',
    target_id   uuid,
    rating      integer     not null default 0,
    comment     varchar(1000),
    created_at  timestamptz not null default now()
);
create index idx_reviews_target on reviews(target_type, target_id);

-- ============================ WALLET ============================
create table wallets (
    id              uuid primary key default gen_random_uuid(),
    owner_id        uuid unique references users(id) on delete cascade,
    owner_role      varchar(24) not null default 'CLIENT',
    balance         bigint      not null default 0,
    pending_balance bigint      not null default 0,
    currency        varchar(8)  not null default 'XOF',
    frozen          boolean     not null default false,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table wallet_transactions (
    id            uuid primary key default gen_random_uuid(),
    wallet_id     uuid not null references wallets(id) on delete cascade,
    type          varchar(24) not null,
    direction     varchar(24) not null default 'CREDIT',
    amount        bigint      not null default 0,
    balance_after bigint      not null default 0,
    status        varchar(24) not null default 'COMPLETED',
    reference     varchar(40),
    description   varchar(240),
    provider      varchar(40),
    created_at    timestamptz not null default now()
);
create index idx_wallet_tx_wallet on wallet_transactions(wallet_id);

-- ============================ CASH ============================
create table cash_sessions (
    id               uuid primary key default gen_random_uuid(),
    agent_id         uuid references users(id) on delete set null,
    opening_balance  bigint      not null default 0,
    closing_balance  bigint,
    expected_balance bigint      not null default 0,
    counted_balance  bigint,
    variance         bigint      not null default 0,
    status           varchar(24) not null default 'OPEN',
    opened_at        timestamptz not null default now(),
    closed_at        timestamptz,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);
create index idx_cash_sessions_agent on cash_sessions(agent_id);

create table cash_movements (
    id         uuid primary key default gen_random_uuid(),
    session_id uuid not null references cash_sessions(id) on delete cascade,
    type       varchar(24) not null default 'IN',
    amount     bigint      not null default 0,
    reference  varchar(40),
    reason     varchar(240),
    created_at timestamptz not null default now()
);
create index idx_cash_movements_session on cash_movements(session_id);

-- ============================ SERVICES À DOMICILE ============================
create table providers (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid unique references users(id) on delete set null,
    display_name varchar(160) not null,
    profession   varchar(80),
    vertical     varchar(60),
    bio          varchar(2000),
    city         varchar(120),
    district     varchar(120),
    hourly_rate  bigint      not null default 0,
    rating       numeric(3,2) default 0,
    review_count integer     not null default 0,
    kyc_status   varchar(24) not null default 'PENDING',
    status       varchar(24) not null default 'APPROVED',
    available    boolean     not null default true,
    avatar_url   varchar(400),
    cover_url    varchar(400),
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);
create index idx_providers_vertical on providers(vertical);

create table bookings (
    id             uuid primary key default gen_random_uuid(),
    ref            varchar(24) not null unique,
    customer_id    uuid references users(id) on delete set null,
    provider_id    uuid references providers(id) on delete set null,
    service_label  varchar(160),
    status         varchar(24) not null default 'PENDING',
    scheduled_at   timestamptz,
    address        varchar(240),
    district       varchar(120),
    quoted_price   bigint      not null default 0,
    final_price    bigint,
    payment_status varchar(24) default 'PENDING',
    notes          varchar(2000),
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);
create index idx_bookings_customer on bookings(customer_id);
create index idx_bookings_provider on bookings(provider_id);

-- ============================ PLATEFORME ============================
create table notifications (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid references users(id) on delete cascade,
    channel    varchar(24)  not null default 'IN_APP',
    title      varchar(160) not null,
    body       varchar(1000),
    category   varchar(40),
    is_read    boolean      not null default false,
    action_url varchar(400),
    created_at timestamptz  not null default now()
);
create index idx_notifications_user on notifications(user_id);

create table ads (
    id         uuid primary key default gen_random_uuid(),
    title      varchar(160) not null,
    subtitle   varchar(400),
    image_url  varchar(400),
    target_url varchar(400),
    placement  varchar(40) default 'HOME_BANNER',
    active     boolean     not null default true,
    starts_at  timestamptz,
    ends_at    timestamptz,
    sort_order integer     not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table subscriptions (
    id              uuid primary key default gen_random_uuid(),
    subscriber_id   uuid references users(id) on delete cascade,
    plan            varchar(40) not null default 'FREE',
    subscriber_role varchar(24),
    status          varchar(24) not null default 'ACTIVE',
    price_per_month bigint      not null default 0,
    started_at      timestamptz,
    renews_at       timestamptz,
    auto_renew      boolean     not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table settings (
    id            uuid primary key default gen_random_uuid(),
    setting_key   varchar(120) not null unique,
    setting_value varchar(2000),
    category      varchar(40) default 'GENERAL',
    description   varchar(240),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create table documents (
    id               uuid primary key default gen_random_uuid(),
    owner_id         uuid references users(id) on delete cascade,
    type             varchar(40)  not null default 'ID_CARD',
    file_url         varchar(400) not null,
    status           varchar(24)  not null default 'PENDING',
    rejection_reason varchar(240),
    created_at       timestamptz  not null default now(),
    updated_at       timestamptz  not null default now()
);
create index idx_documents_owner on documents(owner_id);

create table kyc_records (
    id               uuid primary key default gen_random_uuid(),
    subject_id       uuid references users(id) on delete cascade,
    subject_role     varchar(24) not null default 'DRIVER',
    status           varchar(24) not null default 'PENDING',
    reviewed_by      uuid,
    reviewed_at      timestamptz,
    rejection_reason varchar(240),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);
create index idx_kyc_status on kyc_records(status);

create table media (
    id           uuid primary key default gen_random_uuid(),
    url          varchar(400) not null,
    provider     varchar(24)  not null default 'LOCAL',
    content_type varchar(80),
    file_size    bigint       not null default 0,
    owner_type   varchar(40),
    owner_id     uuid,
    label        varchar(160),
    created_at   timestamptz  not null default now()
);
create index idx_media_owner on media(owner_type, owner_id);
