-- NOVIGO — SP1 : seed des 6 rôles de la plateforme (idempotent).
insert into roles (code, label) values
    ('CLIENT',      'Client'),
    ('DRIVER',      'Livreur'),
    ('MERCHANT',    'Commerçant'),
    ('PROVIDER',    'Prestataire'),
    ('ADMIN',       'Administrateur'),
    ('SUPER_ADMIN', 'Super Administrateur')
on conflict (code) do nothing;
