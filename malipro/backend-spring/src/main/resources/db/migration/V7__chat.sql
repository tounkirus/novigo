-- NOVIGO — SP6 : messagerie (chat) entre utilisateurs.
create table chat_messages (
    id              uuid primary key default gen_random_uuid(),
    conversation_id uuid not null,
    sender_id       uuid not null,
    recipient_id    uuid,
    body            varchar(2000) not null,
    is_read         boolean not null default false,
    created_at      timestamptz not null default now()
);
create index idx_chat_conversation on chat_messages(conversation_id, created_at);
create index idx_chat_sender on chat_messages(sender_id);
create index idx_chat_recipient on chat_messages(recipient_id);
