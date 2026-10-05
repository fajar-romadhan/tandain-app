import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser, Project, StudioProfile } from '../types';

// Default environment variables (if provided in .env or Vercel environment variables)
const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://iwkxcppbhxdkiuborexk.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_gIFstRxDA5Et-svM70T9Tg_jAAtNp95';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!DEFAULT_SUPABASE_URL || !DEFAULT_SUPABASE_ANON_KEY) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
    } catch (err) {
      console.warn('Gagal inisialisasi Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

export const isCloudEnabled = (): boolean => !!(DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY);

/**
 * SQL Schema for Supabase (Paste into Supabase SQL Editor):
 *
 * create table public.projects (
 *   id text primary key,
 *   slug text unique not null,
 *   client_name text not null,
 *   session_date text,
 *   drive_folder_url text,
 *   drive_folder_id text,
 *   quota integer default 50,
 *   pin text,
 *   has_watermark boolean default false,
 *   status text default 'belum_dibuka',
 *   locked boolean default false,
 *   active_selector_device_id text,
 *   photos jsonb default '[]'::jsonb,
 *   selected_file_names jsonb default '[]'::jsonb,
 *   submission_history jsonb default '[]'::jsonb,
 *   revision_round integer default 1,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   last_opened_at timestamp with time zone,
 *   expires_at timestamp with time zone
 * );
 *
 * -- Enable Realtime
 * alter publication supabase_realtime add table public.projects;
 *
 * -- Per-vendor isolation (owner_id, studio_profiles, RLS, client RPC):
 * -- see supabase/migrations/001_vendor_isolation.sql
 */

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

const rowToProject = (data: any): Project => ({
  id: data.id,
  slug: data.slug,
  clientName: data.client_name,
  sessionDate: data.session_date || undefined,
  driveFolderUrl: data.drive_folder_url,
  driveFolderId: data.drive_folder_id,
  quota: data.quota,
  pin: data.pin || undefined,
  hasWatermark: data.has_watermark,
  status: data.status,
  locked: data.locked,
  activeSelectorDeviceId: data.active_selector_device_id || undefined,
  photos: data.photos || [],
  selectedFileNames: data.selected_file_names || [],
  submissionHistory: data.submission_history || [],
  revisionRound: data.revision_round || 1,
  createdAt: data.created_at,
  lastOpenedAt: data.last_opened_at || undefined,
  expiresAt: data.expires_at,
  ownerId: data.owner_id || undefined,
  studioName: data.studio_name || undefined,
  studioWhatsapp: data.studio_whatsapp || undefined,
  waTemplate: data.wa_template || undefined,
});

// ---------------------------------------------------------------------------
// Photographer (owner) operations — protected by RLS: owner_id = auth.uid()
// ---------------------------------------------------------------------------

/** Insert or update a project owned by the logged-in photographer. */
export const saveProjectToCloud = async (project: Project, ownerId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: project.id,
      slug: project.slug,
      owner_id: ownerId,
      client_name: project.clientName,
      session_date: project.sessionDate || null,
      drive_folder_url: project.driveFolderUrl,
      drive_folder_id: project.driveFolderId,
      quota: project.quota,
      pin: project.pin || null,
      has_watermark: project.hasWatermark,
      status: project.status,
      locked: project.locked,
      active_selector_device_id: project.activeSelectorDeviceId || null,
      photos: project.photos,
      selected_file_names: project.selectedFileNames,
      submission_history: project.submissionHistory,
      revision_round: project.revisionRound,
      last_opened_at: project.lastOpenedAt || null,
      expires_at: project.expiresAt,
      studio_name: project.studioName || null,
      studio_whatsapp: project.studioWhatsapp || null,
      wa_template: project.waTemplate || null,
    };

    const { error } = await client.from('projects').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Cloud save failed:', err);
    return false;
  }
};

/** Load ONLY the projects belonging to this photographer. */
export const fetchOwnerProjects = async (ownerId: string): Promise<Project[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Gagal memuat proyek vendor:', error);
    return null;
  }
  return (data || []).map(rowToProject);
};

export const deleteProjectFromCloud = async (projectId: string, ownerId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from('projects').delete().eq('id', projectId).eq('owner_id', ownerId);
  if (error) {
    console.error('Gagal menghapus proyek:', error);
    return false;
  }
  return true;
};

/** Live updates for every project owned by this photographer (e.g. client picks photos). */
export const subscribeOwnerProjects = (
  ownerId: string,
  onChange: (event: 'UPSERT' | 'DELETE', project: Project | { id: string }) => void
): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel(`owner_projects_${ownerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects', filter: `owner_id=eq.${ownerId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const old = payload.old as { id?: string };
          if (old?.id) onChange('DELETE', { id: old.id });
        } else if (payload.new) {
          onChange('UPSERT', rowToProject(payload.new));
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

// ---------------------------------------------------------------------------
// Studio profile per Google account
// ---------------------------------------------------------------------------

export const fetchStudioProfileFromCloud = async (ownerId: string): Promise<Partial<StudioProfile> | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('studio_profiles')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    studioName: data.studio_name || '',
    whatsapp: data.whatsapp || '',
    logoUrl: data.logo_url || '',
    accentColor: data.accent_color || undefined,
    waTemplate: data.wa_template || undefined,
    googleApiKey: data.google_api_key || undefined,
  };
};

/** Save profile and refresh the branding snapshot on all of this vendor's projects. */
export const saveStudioProfileToCloud = async (ownerId: string, profile: StudioProfile): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from('studio_profiles').upsert(
    {
      owner_id: ownerId,
      studio_name: profile.studioName,
      whatsapp: profile.whatsapp,
      logo_url: profile.logoUrl || null,
      accent_color: profile.accentColor,
      wa_template: profile.waTemplate,
      google_api_key: profile.googleApiKey || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'owner_id' }
  );

  if (error) {
    console.error('Gagal menyimpan profil studio:', error);
    return false;
  }

  const { error: syncError } = await client
    .from('projects')
    .update({
      studio_name: profile.studioName,
      studio_whatsapp: profile.whatsapp,
      wa_template: profile.waTemplate,
    })
    .eq('owner_id', ownerId);

  if (syncError) console.warn('Gagal sinkron branding ke proyek:', syncError);
  return true;
};

// ---------------------------------------------------------------------------
// Client (no login) operations
// ---------------------------------------------------------------------------

/** Fetch a project by slug from Supabase (public read for gallery links). */
export const fetchProjectFromCloud = async (slug: string): Promise<Project | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    return rowToProject(data);
  } catch (err) {
    console.error('Cloud fetch failed:', err);
    return null;
  }
};

/**
 * Client-side update via restricted RPC: only selection-related columns can change,
 * owner/quota/photos are untouchable, and a locked gallery cannot be reopened.
 */
export const clientUpdateProjectInCloud = async (project: Project): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.rpc('client_update_project', {
    p_slug: project.slug,
    p_selected_file_names: project.selectedFileNames,
    p_status: project.status,
    p_locked: project.locked,
    p_active_selector_device_id: project.activeSelectorDeviceId || null,
    p_submission_history: project.submissionHistory,
    p_last_opened_at: project.lastOpenedAt || null,
  });

  if (error) {
    console.error('Gagal menyimpan pilihan klien:', error);
    return false;
  }
  return true;
};

// Subscribe to real-time changes on a single project (client gallery)
export const subscribeProjectFromCloud = (
  slug: string,
  onUpdate: (updatedProject: Project) => void
): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel(`project_${slug}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
        filter: `slug=eq.${slug}`,
      },
      (payload) => {
        if (payload.new) onUpdate(rowToProject(payload.new));
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

// ---------------------------------------------------------------------------
// Authentication — Google is the ONLY login path for photographers
// ---------------------------------------------------------------------------

/**
 * Check whether the Google provider is enabled in Supabase before redirecting.
 * Without this, a disabled provider sends the user to a raw JSON error page.
 */
export const isGoogleProviderEnabled = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${DEFAULT_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: DEFAULT_SUPABASE_ANON_KEY },
    });
    if (!res.ok) return true; // can't tell — let Supabase decide
    const json = await res.json();
    return !!json?.external?.google;
  } catch {
    return true;
  }
};

export const signInWithGoogle = async (): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Koneksi ke server belum tersedia. Coba muat ulang halaman.');
  }

  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/?view=fg` : '';
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      // Always show the account chooser so studios sharing a laptop don't get mixed up
      queryParams: { prompt: 'select_account' },
    },
  });

  if (error) throw error;
};

export const signOutUser = async (): Promise<void> => {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
};

/**
 * Subscribe to auth state. Fires immediately with the current session (INITIAL_SESSION),
 * so the first callback also tells us auth is "ready".
 */
export const subscribeAuthChanges = (callback: (user: AuthUser | null) => void): (() => void) => {
  const client = getSupabaseClient();
  if (!client) {
    callback(null);
    return () => {};
  }

  const { data } = client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        avatarUrl: session.user.user_metadata?.avatar_url,
      });
    } else {
      callback(null);
    }
  });

  return () => {
    data.subscription.unsubscribe();
  };
};
