-- NOVIGO — SP4 : favoris utilisateur (boutiques, produits, prestataires).
create table favorites (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references users(id) on delete cascade,
    target_type varchar(24) not null default 'STORE',
    target_id   uuid not null,
    created_at  timestamptz not null default now(),
    constraint uk_favorite_user_target unique (user_id, target_type, target_id)
);
create index idx_favorites_user on favorites(user_id);
