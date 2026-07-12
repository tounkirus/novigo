-- NOVIGO — base logique unique (ADR-4) : 1 cluster, 1 schéma par service.
-- Exécuté par l'image postgres au premier démarrage (docker-entrypoint-initdb.d).
-- « ops »     = possédé par NestJS (Prisma)  — identité, commandes, temps réel.
-- « finance » = possédé par Spring (Flyway)  — wallet, paiements, compta, admin.
CREATE SCHEMA IF NOT EXISTS ops     AUTHORIZATION novigo;
CREATE SCHEMA IF NOT EXISTS finance AUTHORIZATION novigo;
