import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Project } from '../types';

// Default environment variables (if provided in .env or Vercel environment variables)
const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://iwkxcppbhxdkiuborexk.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_gIFstRxDA5Et-svM70T9Tg_jAAtNp95';

let supabaseInstance: SupabaseClient | null = null;

const getStoredStudioCredentials = () => {
  if (typeof window === 'undefined') return { url: '', key: '' };
  try {
    const raw = localStorage.getItem('tandain_studio_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { url: (parsed.supabaseUrl || '').trim(), key: (parsed.supabaseAnonKey || '').trim() };
    }
  } catch {}
  return { url: '', key: '' };
};

export const getSupabaseClient = (customUrl?: string, customKey?: string): SupabaseClient | null => {
  const stored = getStoredStudioCredentials();
  const url = customUrl || DEFAULT_SUPABASE_URL || stored.url;
  const key = customKey || DEFAULT_SUPABASE_ANON_KEY || stored.key;

  if (!url || !key) return null;

  if (!supabaseInstance || customUrl || customKey) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (err) {
      console.warn('Gagal inisialisasi Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

export const isCloudEnabled = (): boolean => {
  const stored = getStoredStudioCredentials();
  return !!((DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY) || (stored.url && stored.key));
};

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
 */

// Save or update a project to Supabase
export const saveProjectToCloud = async (project: Project): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: project.id,
      slug: project.slug,
      client_name: project.clientName,
      session_date: project.sessionDate,
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
      last_opened_at: project.lastOpenedAt,
      expires_at: project.expiresAt,
    };

    const { error } = await client.from('projects').upsert(payload, { onConflict: 'slug' });
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

// Fetch a project by slug from Supabase
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

    const project: Project = {
      id: data.id,
      slug: data.slug,
      clientName: data.client_name,
      sessionDate: data.session_date,
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
      lastOpenedAt: data.last_opened_at,
      expiresAt: data.expires_at,
    };

    return project;
  } catch (err) {
    console.error('Cloud fetch failed:', err);
    return null;
  }
};

// Subscribe to real-time changes on a project
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
        const data = payload.new as any;
        if (data) {
          const project: Project = {
            id: data.id,
            slug: data.slug,
            clientName: data.client_name,
            sessionDate: data.session_date,
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
            lastOpenedAt: data.last_opened_at,
            expiresAt: data.expires_at,
          };
          onUpdate(project);
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

/**
 * Authentication Methods for Photographers
 */
export const signInWithGoogle = async (): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum dikonfigurasi. Isi Supabase URL & Key di Pengaturan Studio.');
  }

  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/?view=fg` : '';
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
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

export const getCurrentAuthUser = async (): Promise<{ id: string; email?: string; name?: string; avatarUrl?: string } | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data } = await client.auth.getUser();
    const user = data?.user;
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatarUrl: user.user_metadata?.avatar_url,
    };
  } catch (err) {
    console.warn('Error fetching current user:', err);
    return null;
  }
};

export const subscribeAuthChanges = (
  callback: (user: { id: string; email?: string; name?: string; avatarUrl?: string } | null) => void
): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

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
