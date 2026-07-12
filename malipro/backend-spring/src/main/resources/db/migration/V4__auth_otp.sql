-- NOVIGO — SP3 : défis OTP (codes à usage unique email/SMS pour login & vérification).
create table otp_challenges (
    id         uuid primary key default gen_random_uuid(),
    target     varchar(160) not null,
    channel    varchar(16)  not null default 'SMS',
    purpose    varchar(24)  not null default 'LOGIN',
    code_hash  varchar(120) not null,
    expires_at timestamptz  not null,
    consumed   boolean      not null default false,
    attempts   integer      not null default 0,
    created_at timestamptz  not null default now()
);
create index idx_otp_target_purpose on otp_challenges(target, purpose);
