-- =====================================================================
-- TANDAIN — Migrasi 001: Isolasi data per vendor (login Google)
-- Jalankan SEKALI di Supabase Dashboard → SQL Editor → New query → Run.
-- Aman dijalankan ulang (idempotent).
-- =====================================================================

-- 1. Kolom pemilik + snapshot branding studio di setiap proyek
alter table public.projects add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.projects add column if not exists studio_name text;
alter table public.projects add column if not exists studio_whatsapp text;
alter table public.projects add column if not exists wa_template text;
create index if not exists projects_owner_id_idx on public.projects(owner_id);

-- 2. Profil studio per akun Google
create table if not exists public.studio_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  studio_name text not null default '',
  whatsapp text not null default '',
  logo_url text,
  accent_color text default '#1D1D1F',
  wa_template text,
  google_api_key text,
  updated_at timestamptz not null default now()
);
alter table public.studio_profiles enable row level security;

drop policy if exists "studio_profiles_owner_all" on public.studio_profiles;
create policy "studio_profiles_owner_all" on public.studio_profiles
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 3. RLS proyek: vendor hanya bisa tulis/hapus proyek miliknya sendiri
alter table public.projects enable row level security;
drop policy if exists "Allow public access" on public.projects;
drop policy if exists "projects_public_read" on public.projects;
drop policy if exists "projects_owner_insert" on public.projects;
drop policy if exists "projects_owner_update" on public.projects;
drop policy if exists "projects_owner_delete" on public.projects;

-- Klien (tanpa login) perlu membaca galeri lewat link ?p=slug
create policy "projects_public_read" on public.projects
  for select using (true);

create policy "projects_owner_insert" on public.projects
  for insert to authenticated with check (owner_id = auth.uid());

create policy "projects_owner_update" on public.projects
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "projects_owner_delete" on public.projects
  for delete to authenticated using (owner_id = auth.uid());

-- 4. Jalur khusus klien: hanya boleh mengubah kolom seleksi, tidak bisa
--    mengubah pemilik/kuota/foto, dan tidak bisa membuka kunci galeri.
create or replace function public.client_update_project(
  p_slug text,
  p_selected_file_names jsonb default null,
  p_status text default null,
  p_locked boolean default null,
  p_active_selector_device_id text default null,
  p_submission_history jsonb default null,
  p_last_opened_at timestamptz default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects set
    selected_file_names = coalesce(p_selected_file_names, selected_file_names),
    status = case when p_status in ('lagi_milih', 'udah_kirim') then p_status else status end,
    locked = locked or coalesce(p_locked, false),
    active_selector_device_id = coalesce(p_active_selector_device_id, active_selector_device_id),
    submission_history = coalesce(p_submission_history, submission_history),
    last_opened_at = coalesce(p_last_opened_at, last_opened_at)
  where slug = p_slug
    and locked = false;
end;
$$;

grant execute on function public.client_update_project(text, jsonb, text, boolean, text, jsonb, timestamptz) to anon, authenticated;
