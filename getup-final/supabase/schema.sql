-- ============================================================================
-- Crest Capital — Supabase schema
-- Run the ENTIRE file in the Supabase SQL editor.
-- Tables: users, spaces, transfers, transactions, notifications, otp_codes,
--         admin_actions.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- USERS
-- Starting balance is ZERO. Admin has to seed / edit before there's anything.
-- onboarding_status controls the user journey:
--   PENDING_REVIEW  → signup complete, waiting for admin review
--   APPROVED        → can use the app
--   REJECTED        → rejected, cannot sign in
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id                 uuid primary key default uuid_generate_v4(),
  email              text unique not null,
  password_hash      text not null,

  role               text not null default 'user' check (role in ('user','admin')),

  -- Identity
  first_name         text,
  middle_name        text,
  last_name          text,
  phone              text,
  date_of_birth      date,
  nationality        text,
  place_of_birth     text,

  -- Address
  street             text,
  street_number      text,
  city               text,
  postal_code        text,
  country            text default 'DE',

  -- Employment / financial (German bank onboarding)
  employment_status  text,          -- employed / self_employed / student / retired / unemployed
  employer           text,
  occupation         text,
  monthly_income     text,          -- income band
  source_of_funds    text,
  tax_id             text,          -- German Steuer-ID
  id_document_type   text,          -- passport / id_card
  id_document_number text,

  -- Banking
  iban               text unique,
  account_number     text,
  bic                text default 'CRSTDEB1XXX',
  card_last4         text,

  -- Balances (start at ZERO)
  balance_checking   numeric(14,2) not null default 0,
  balance_savings    numeric(14,2) not null default 0,

  -- Flags
  email_verified     boolean not null default false,
  blocked            boolean not null default false,
  blocked_reason     text,
  blocked_at         timestamptz,

  -- Onboarding
  onboarding_status  text not null default 'PENDING_REVIEW'
                     check (onboarding_status in ('PENDING_REVIEW','APPROVED','REJECTED')),
  rejection_reason   text,
  reviewed_at        timestamptz,
  reviewed_by        uuid references public.users(id),

  -- Profile
  avatar_url         text,
  currency           text default 'EUR',
  locale             text default 'de-DE',
  timezone           text default 'Europe/Berlin',

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);
create index if not exists users_role_idx on public.users (role);
create index if not exists users_blocked_idx on public.users (blocked);
create index if not exists users_onboarding_idx on public.users (onboarding_status, created_at desc);
create index if not exists users_created_at_idx on public.users (created_at desc);

-- ----------------------------------------------------------------------------
-- SPACES
-- ----------------------------------------------------------------------------
create table if not exists public.spaces (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  name          text not null,
  goal_amount   numeric(14,2) default 0,
  balance       numeric(14,2) not null default 0,
  target_date   date,
  locked_until  date,
  emoji         text default '💰',
  created_at    timestamptz not null default now()
);

-- In case an older deployment created the table without the new columns,
-- add them safely:
alter table public.spaces add column if not exists target_date  date;
alter table public.spaces add column if not exists locked_until date;
create index if not exists spaces_user_idx on public.spaces (user_id);

-- ----------------------------------------------------------------------------
-- TRANSFERS (intents)
-- ----------------------------------------------------------------------------
create table if not exists public.transfers (
  id                 uuid primary key default uuid_generate_v4(),
  reference_id       text unique not null,
  user_id            uuid not null references public.users(id) on delete cascade,

  rail               text not null check (rail in ('sepa','sepa_instant','internal','swift')),
  direction          text not null default 'debit' check (direction in ('debit','credit')),
  account_type       text not null default 'checking' check (account_type in ('checking','savings')),

  amount             numeric(14,2) not null check (amount > 0),
  currency           text not null default 'EUR',
  fee                numeric(14,2) not null default 0,

  beneficiary_name   text not null,
  beneficiary_iban   text,
  beneficiary_bic    text,
  beneficiary_email  text,
  beneficiary_user_id uuid references public.users(id),

  beneficiary_country  text,
  beneficiary_address  text,
  intermediary_bank    text,

  reference          text,
  memo               text,

  status             text not null default 'pending_admin'
                     check (status in ('pending_admin','approved','rejected','completed','canceled')),

  rejection_reason   text,

  submitted_at       timestamptz not null default now(),
  reviewed_at        timestamptz,
  reviewed_by        uuid references public.users(id),
  completed_at       timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists transfers_user_idx      on public.transfers (user_id, created_at desc);
create index if not exists transfers_status_idx    on public.transfers (status, created_at desc);
create index if not exists transfers_reference_idx on public.transfers (reference_id);

-- ----------------------------------------------------------------------------
-- TRANSACTIONS
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  transfer_id    uuid references public.transfers(id) on delete set null,

  account_type   text not null default 'checking' check (account_type in ('checking','savings')),

  direction      text not null check (direction in ('debit','credit')),
  amount         numeric(14,2) not null,
  currency       text not null default 'EUR',

  rail           text check (rail in ('sepa','sepa_instant','internal','swift','card','fee','topup','salary','refund','adjustment')),
  category       text default 'Transfer' check (category in ('Transfer','Income','Bills','Dining','Groceries','Transport','Shopping','Refund','Subscriptions','Housing','Fee','Topup','Salary','Travel','Entertainment','Health')),

  counterparty_name  text,
  counterparty_iban  text,
  counterparty_email text,

  description    text,
  merchant       text,
  reference      text,

  status         text not null default 'posted' check (status in ('pending','posted','failed','reversed')),

  created_at     timestamptz not null default now()
);
create index if not exists tx_user_idx      on public.transactions (user_id, created_at desc);
create index if not exists tx_direction_idx on public.transactions (user_id, direction, created_at desc);
create index if not exists tx_account_idx   on public.transactions (user_id, account_type, created_at desc);
create index if not exists tx_transfer_idx  on public.transactions (transfer_id);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  kind          text not null check (kind in ('transfer_submitted','transfer_approved','transfer_rejected','account_blocked','account_unblocked','credit','debit','welcome','security','info','admin_adjustment','application_approved','application_rejected')),
  title         text not null,
  body          text,
  metadata      jsonb,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notif_unread_idx on public.notifications (user_id, read) where read = false;

-- ----------------------------------------------------------------------------
-- OTP codes — for login + forget password
-- In dev with no RESEND_API_KEY, the app accepts "000000".
-- ----------------------------------------------------------------------------
create table if not exists public.otp_codes (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null,
  code_hash   text not null,
  purpose     text not null check (purpose in ('login','password_reset')),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists otp_email_idx on public.otp_codes (email, purpose, created_at desc);

-- ----------------------------------------------------------------------------
-- ADMIN AUDIT
-- ----------------------------------------------------------------------------
create table if not exists public.admin_actions (
  id            uuid primary key default uuid_generate_v4(),
  admin_id      uuid not null references public.users(id),
  action        text not null,
  target_type   text not null,
  target_id     uuid not null,
  notes         text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists admin_actions_admin_idx on public.admin_actions (admin_id, created_at desc);
create index if not exists admin_actions_target_idx on public.admin_actions (target_type, target_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated on public.users;
create trigger users_set_updated before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists transfers_set_updated on public.transfers;
create trigger transfers_set_updated before update on public.transfers
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS — service role key bypasses.
-- ----------------------------------------------------------------------------
alter table public.users            enable row level security;
alter table public.spaces           enable row level security;
alter table public.transfers        enable row level security;
alter table public.transactions     enable row level security;
alter table public.notifications    enable row level security;
alter table public.otp_codes        enable row level security;
alter table public.admin_actions    enable row level security;

-- ----------------------------------------------------------------------------
-- SEED — admin Valentine Nonny
-- password: val999 — bcrypt cost-10 hash below.
-- To regenerate:  node -e "console.log(require('bcryptjs').hashSync('val999',10))"
-- ----------------------------------------------------------------------------
insert into public.users (email, password_hash, role, first_name, last_name, email_verified, iban, balance_checking, balance_savings, onboarding_status)
values (
  'valentine@crestcapital.com',
  '$2a$10$TQL.4qIqfdyDidAu608CNuiQzCnRIKGwe/vtfUB3ETonDk/j4A4cW',
  'admin',
  'Valentine',
  'Nonny',
  true,
  'DE00 0000 0000 0000 0000 00',
  0,
  0,
  'APPROVED'
)
on conflict (email) do nothing;
