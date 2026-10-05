import type { Project, StudioProfile } from '../types';
import { DEFAULT_STUDIO } from './sampleData';

const STORAGE_KEYS = {
  PROJECTS: 'tandain_projects_v1',
  STUDIO: 'tandain_studio_v1',
  DEVICE_ID: 'tandain_device_id_v1',
};

// Cross-tab real-time event bus
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('tandain_realtime_events')
  : null;

export type RealtimeEvent =
  | { type: 'SELECTION_CHANGE'; projectId: string; selectedFileNames: string[]; deviceId: string }
  | { type: 'PROJECT_SUBMITTED'; projectId: string; selectedFileNames: string[] }
  | { type: 'PROJECT_LOCKED_CHANGE'; projectId: string; locked: boolean }
  | { type: 'QUOTA_CHANGE'; projectId: string; quota: number }
  | { type: 'SELECTOR_TAKEOVER'; projectId: string; newDeviceId: string }
  | { type: 'PROJECT_EXPIRES_CHANGE'; projectId: string; expiresAt: string };

type EventListener = (event: RealtimeEvent) => void;
const listeners: Set<EventListener> = new Set();

if (channel) {
  channel.onmessage = (msg: MessageEvent<RealtimeEvent>) => {
    listeners.forEach((fn) => fn(msg.data));
  };
}

export const subscribeRealtime = (fn: EventListener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const broadcastEvent = (event: RealtimeEvent) => {
  listeners.forEach((fn) => fn(event));
  channel?.postMessage(event);
};

export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  }
  return id;
};

// ---------------------------------------------------------------------------
// Per-vendor local cache (Supabase is the source of truth; this only makes the
// dashboard appear instantly). Keys are namespaced by the Google user id so two
// studios sharing one laptop never see each other's projects.
// ---------------------------------------------------------------------------

const projectsKey = (ownerId: string) => `${STORAGE_KEYS.PROJECTS}:${ownerId}`;
const studioKey = (ownerId: string) => `${STORAGE_KEYS.STUDIO}:${ownerId}`;

export const loadCachedProjects = (ownerId: string): Project[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(projectsKey(ownerId));
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
};

export const saveCachedProjects = (ownerId: string, projects: Project[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(projectsKey(ownerId), JSON.stringify(projects));
};

/** Search across all locally cached project lists on this device by slug. */
export const findLocalProjectBySlug = (slug: string): Project | null => {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.PROJECTS)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw) as Project[];
          const match = list.find((p) => p.slug === slug);
          if (match) return match;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
};

/** Default profile for a freshly signed-in vendor (prefilled with their Google name). */
export const createDefaultStudio = (displayName?: string): StudioProfile => ({
  ...DEFAULT_STUDIO,
  studioName: displayName || '',
  whatsapp: '',
});

export const loadCachedStudio = (ownerId: string, displayName?: string): StudioProfile => {
  const fallback = createDefaultStudio(displayName);
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(studioKey(ownerId));
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<StudioProfile>) } : fallback;
  } catch {
    return fallback;
  }
};

export const saveCachedStudio = (ownerId: string, profile: StudioProfile) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(studioKey(ownerId), JSON.stringify(profile));
};

/** Branding the CLIENT sees — taken from the project itself, never from the visitor's device. */
export const studioFromProject = (project: Project): StudioProfile => ({
  ...DEFAULT_STUDIO,
  studioName: project.studioName || 'Studio Foto',
  whatsapp: project.studioWhatsapp || '',
  waTemplate: project.waTemplate || DEFAULT_STUDIO.waTemplate,
});

/** Remove legacy global keys from the pre-login era so old demo data can't leak in. */
export const clearLegacyStorage = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.PROJECTS);
  localStorage.removeItem(STORAGE_KEYS.STUDIO);
};
