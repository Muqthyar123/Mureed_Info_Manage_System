create extension if not exists pgcrypto;

create table if not exists profiles (
    id text primary key,
    name text not null,
    email text not null unique,
    role text not null check (role in ('MAIN_ADMIN', 'ADMIN', 'MUREED')),
    status text not null default 'PENDING' check (status in ('ACTIVE', 'PENDING', 'PENDING_SETUP', 'INACTIVE', 'REJECTED')),
    auth_provider text not null default 'password' check (auth_provider in ('password', 'google')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists peers (
    id text primary key,
    name text not null unique,
    status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists mureeds (
    id text primary key,
    user_id text unique references profiles(id) on delete set null,
    name text not null,
    date_of_birth date not null check (date_of_birth < current_date),
    gender text not null check (gender in ('Male', 'Female')),
    address text not null,
    phone text not null,
    email text not null unique,
    peer_id text references peers(id) on delete restrict,
    status text not null default 'AVAILABLE' check (status in ('AVAILABLE', 'PASSED_OUT')),
    account_status text not null default 'PENDING_SETUP' check (account_status in ('PENDING_SETUP', 'ACTIVE', 'INACTIVE')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists admin_approval_requests (
    id text primary key,
    user_id text references profiles(id) on delete cascade,
    name text not null,
    email text not null,
    auth_provider text not null check (auth_provider in ('password', 'google')),
    status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
    requested_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by text references profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (email, auth_provider)
);

create index if not exists idx_mureeds_email on mureeds (email);
create index if not exists idx_mureeds_phone on mureeds (phone);
create index if not exists idx_mureeds_peer_id on mureeds (peer_id);
create index if not exists idx_mureeds_status on mureeds (status);
create index if not exists idx_mureeds_gender on mureeds (gender);
create index if not exists idx_mureeds_created_at on mureeds (created_at);
create index if not exists idx_profiles_role_status on profiles (role, status);
create index if not exists idx_admin_requests_status on admin_approval_requests (status);

alter table profiles enable row level security;
alter table peers enable row level security;
alter table mureeds enable row level security;
alter table admin_approval_requests enable row level security;

create or replace function app_is_admin()
returns boolean
language sql
stable
as $$
    select exists (
        select 1 from profiles
        where id = auth.uid()
          and role in ('MAIN_ADMIN', 'ADMIN')
          and status = 'ACTIVE'
    );
$$;

create or replace function app_is_main_admin()
returns boolean
language sql
stable
as $$
    select exists (
        select 1 from profiles
        where id = auth.uid()
          and role = 'MAIN_ADMIN'
          and status = 'ACTIVE'
    );
$$;

drop policy if exists "admins manage peers" on peers;
create policy "admins manage peers" on peers
    for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists "admins manage mureeds" on mureeds;
create policy "admins manage mureeds" on mureeds
    for all using (app_is_admin()) with check (app_is_admin());

drop policy if exists "mureeds read own record" on mureeds;
create policy "mureeds read own record" on mureeds
    for select using (user_id = auth.uid());

drop policy if exists "users read own profile" on profiles;
create policy "users read own profile" on profiles
    for select using (id = auth.uid() or app_is_admin());

drop policy if exists "main admins manage approval requests" on admin_approval_requests;
create policy "main admins manage approval requests" on admin_approval_requests
    for all using (app_is_main_admin()) with check (app_is_main_admin());
