import { getSupabaseClient } from './supabase';

/**
 * Owner (super admin) services.
 *
 * Every call goes through a SECURITY DEFINER RPC that re-checks on the server
 * that the logged-in email is in public.app_admins (see
 * supabase/migrations/002_owner_admin.sql). Nothing here grants access by itself.
 */

export interface AdminStats {
  vendors: number;
  projects: number;
  active_projects: number;
  submitted_projects: number;
  photos: number;
  selected_photos: number;
  new_vendors_7d: number;
}

export interface AdminVendor {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
  studio_name: string;
  whatsapp: string;
  project_count: number;
}

export interface AdminProject {
  id: string;
  slug: string;
  client_name: string;
  owner_id: string | null;
  studio_name: string | null;
  studio_whatsapp: string | null;
  quota: number;
  status: string;
  locked: boolean;
  has_watermark: boolean;
  created_at: string;
  expires_at: string | null;
  last_opened_at: string | null;
  photo_count: number;
  selected_count: number;
}

export type AnnouncementTone = 'info' | 'warning' | 'success';

export interface Announcement {
  active: boolean;
  message: string;
  tone: AnnouncementTone;
}

export interface AdminDashboardData {
  stats: AdminStats;
  vendors: AdminVendor[];
  projects: AdminProject[];
  announcement: Announcement;
}

export type AdminCheckResult = 'admin' | 'not_admin' | 'setup_required' | 'error';

/** PostgREST returns PGRST202 / 42883 when the RPC hasn't been created yet. */
const isMissingFunction = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === 'PGRST202' || error.code === '42883' || /could not find the function/i.test(error.message || ''));

export const checkIsAdmin = async (): Promise<AdminCheckResult> => {
  const client = getSupabaseClient();
  if (!client) return 'error';
  const { data, error } = await client.rpc('is_app_admin');
  if (error) return isMissingFunction(error) ? 'setup_required' : 'error';
  return data === true ? 'admin' : 'not_admin';
};

export const fetchAdminDashboard = async (): Promise<AdminDashboardData> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Koneksi ke server belum tersedia.');
  const { data, error } = await client.rpc('admin_dashboard');
  if (error) throw new Error(error.message);
  const raw = (data || {}) as Partial<AdminDashboardData>;
  return {
    stats: raw.stats as AdminStats,
    vendors: raw.vendors || [],
    projects: raw.projects || [],
    announcement: {
      active: !!raw.announcement?.active,
      message: raw.announcement?.message || '',
      tone: (raw.announcement?.tone as AnnouncementTone) || 'info',
    },
  };
};

export const adminUpdateProject = async (
  id: string,
  changes: { locked?: boolean; expiresAt?: string; hasWatermark?: boolean }
): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Koneksi ke server belum tersedia.');
  const { error } = await client.rpc('admin_update_project', {
    p_id: id,
    p_locked: changes.locked ?? null,
    p_expires_at: changes.expiresAt ?? null,
    p_has_watermark: changes.hasWatermark ?? null,
  });
  if (error) throw new Error(error.message);
};

export const adminDeleteProject = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Koneksi ke server belum tersedia.');
  const { error } = await client.rpc('admin_delete_project', { p_id: id });
  if (error) throw new Error(error.message);
};

export const adminSetAnnouncement = async (a: Announcement): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Koneksi ke server belum tersedia.');
  const { error } = await client.rpc('admin_set_announcement', {
    p_active: a.active,
    p_message: a.message,
    p_tone: a.tone,
  });
  if (error) throw new Error(error.message);
};

/** Public: the banner every photographer sees on their dashboard (null if off / not set up). */
export const fetchPublicAnnouncement = async (): Promise<Announcement | null> => {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('app_settings').select('value').eq('key', 'announcement').maybeSingle();
  if (error || !data?.value) return null;
  const v = data.value as Partial<Announcement>;
  if (!v.active || !v.message) return null;
  return { active: true, message: v.message, tone: (v.tone as AnnouncementTone) || 'info' };
};
