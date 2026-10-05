-- =====================================================================
-- TANDAIN — Migrasi 002: Panel Owner (Super Admin)
-- Jalankan SEKALI di Supabase Dashboard → SQL Editor → New query → Run.
-- Aman dijalankan ulang (idempotent).
--
-- Kenapa perlu SQL ini?
--   URL rahasia hanya MENYEMBUNYIKAN halaman login owner. Yang benar-benar
--   melindungi data adalah pengecekan di server: setiap fungsi admin_* di
--   bawah menolak siapa pun yang email login-nya tidak ada di app_admins.
-- =====================================================================

-- 1. Daftar email owner. Tabel ini TIDAK bisa dibaca/diubah dari browser
--    (RLS aktif tanpa policy) — hanya lewat SQL Editor ini.
create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;

-- >>> GANTI email di bawah jika akun owner kamu berbeda <<<
insert into public.app_admins (email) values ('fajaromadhan@gmail.com')
on conflict (email) do nothing;

-- 2. Cek apakah user yang sedang login adalah owner
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_app_admin() to authenticated;

-- 3. Pengaturan global (pengumuman untuk semua fotografer)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

drop policy if exists "app_settings_public_read_announcement" on public.app_settings;
create policy "app_settings_public_read_announcement" on public.app_settings
  for select using (key = 'announcement');

insert into public.app_settings (key, value)
values ('announcement', '{"active": false, "message": "", "tone": "info"}'::jsonb)
on conflict (key) do nothing;

-- 4. Data lengkap untuk dashboard owner (statistik + vendor + proyek)
--    Kolom photos (besar) tidak dikirim, hanya jumlahnya, agar ringan di HP.
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  result jsonb;
begin
  if not public.is_app_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'stats', jsonb_build_object(
      'vendors', (select count(*) from auth.users),
      'projects', (select count(*) from public.projects),
      'active_projects', (select count(*) from public.projects where locked = false and (expires_at is null or expires_at > now())),
      'submitted_projects', (select count(*) from public.projects where status in ('udah_kirim', 'selesai')),
      'photos', (select coalesce(sum(jsonb_array_length(coalesce(photos, '[]'::jsonb))), 0) from public.projects),
      'selected_photos', (select coalesce(sum(jsonb_array_length(coalesce(selected_file_names, '[]'::jsonb))), 0) from public.projects),
      'new_vendors_7d', (select count(*) from auth.users where created_at > now() - interval '7 days')
    ),
    'vendors', coalesce((
      select jsonb_agg(v order by v.created_at desc)
      from (
        select
          u.id,
          u.email,
          u.created_at,
          u.last_sign_in_at,
          coalesce(u.raw_app_meta_data ->> 'provider', 'email') as provider,
          coalesce(sp.studio_name, u.raw_user_meta_data ->> 'studio_name', u.raw_user_meta_data ->> 'full_name', '') as studio_name,
          coalesce(sp.whatsapp, u.raw_user_meta_data ->> 'whatsapp', '') as whatsapp,
          (select count(*) from public.projects p where p.owner_id = u.id) as project_count
        from auth.users u
        left join public.studio_profiles sp on sp.owner_id = u.id
      ) v
    ), '[]'::jsonb),
    'projects', coalesce((
      select jsonb_agg(p order by p.created_at desc)
      from (
        select
          id, slug, client_name, owner_id, studio_name, studio_whatsapp,
          quota, status, locked, has_watermark, created_at, expires_at, last_opened_at,
          jsonb_array_length(coalesce(photos, '[]'::jsonb)) as photo_count,
          jsonb_array_length(coalesce(selected_file_names, '[]'::jsonb)) as selected_count
        from public.projects
      ) p
    ), '[]'::jsonb),
    'announcement', coalesce((select value from public.app_settings where key = 'announcement'), '{}'::jsonb)
  ) into result;

  return result;
end;
$$;
grant execute on function public.admin_dashboard() to authenticated;

-- 5. Moderasi proyek milik vendor mana pun
create or replace function public.admin_update_project(
  p_id text,
  p_locked boolean default null,
  p_expires_at timestamptz default null,
  p_has_watermark boolean default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  update public.projects set
    locked = coalesce(p_locked, locked),
    status = case
      when p_locked is true then 'udah_kirim'
      when p_locked is false and status = 'udah_kirim' then 'lagi_milih'
      else status
    end,
    expires_at = coalesce(p_expires_at, expires_at),
    has_watermark = coalesce(p_has_watermark, has_watermark)
  where id = p_id;
end;
$$;
grant execute on function public.admin_update_project(text, boolean, timestamptz, boolean) to authenticated;

create or replace function public.admin_delete_project(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  delete from public.projects where id = p_id;
end;
$$;
grant execute on function public.admin_delete_project(text) to authenticated;

-- 6. Simpan pengumuman global
create or replace function public.admin_set_announcement(
  p_active boolean,
  p_message text,
  p_tone text default 'info'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  insert into public.app_settings (key, value, updated_at)
  values (
    'announcement',
    jsonb_build_object(
      'active', coalesce(p_active, false),
      'message', left(coalesce(p_message, ''), 280),
      'tone', case when p_tone in ('info', 'warning', 'success') then p_tone else 'info' end
    ),
    now()
  )
  on conflict (key) do update set value = excluded.value, updated_at = now();
end;
$$;
grant execute on function public.admin_set_announcement(boolean, text, text) to authenticated;
