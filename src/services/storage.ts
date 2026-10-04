import type { Project, StudioProfile } from '../types';
import { DEFAULT_STUDIO, INITIAL_PROJECTS } from './sampleData';

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

export const loadProjects = (): Project[] => {
  if (typeof window === 'undefined') return INITIAL_PROJECTS;
  const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
    return INITIAL_PROJECTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROJECTS;
  }
};

export const saveProjects = (projects: Project[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

export const getProjectBySlug = (slug: string): Project | undefined => {
  const all = loadProjects();
  return all.find((p) => p.slug.toLowerCase() === slug.toLowerCase() || p.id === slug);
};

export const updateProject = (updated: Project): Project => {
  const all = loadProjects();
  const index = all.findIndex((p) => p.id === updated.id);
  if (index >= 0) {
    all[index] = updated;
  } else {
    all.unshift(updated);
  }
  saveProjects(all);
  return updated;
};

export const loadStudioProfile = (): StudioProfile => {
  if (typeof window === 'undefined') return DEFAULT_STUDIO;
  const raw = localStorage.getItem(STORAGE_KEYS.STUDIO);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.STUDIO, JSON.stringify(DEFAULT_STUDIO));
    return DEFAULT_STUDIO;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STUDIO;
  }
};

export const saveStudioProfile = (profile: StudioProfile) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.STUDIO, JSON.stringify(profile));
};
