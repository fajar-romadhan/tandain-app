export type ProjectStatus = 'belum_dibuka' | 'lagi_milih' | 'udah_kirim' | 'selesai';

export interface Photo {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export interface SubmissionHistory {
  round: number;
  fileNames: string[];
  submittedAt: string;
}

export interface Project {
  id: string;
  slug: string;
  clientName: string;
  sessionDate?: string;
  driveFolderUrl: string;
  driveFolderId: string;
  quota: number;
  pin?: string;
  hasWatermark: boolean;
  status: ProjectStatus;
  locked: boolean;
  activeSelectorDeviceId?: string;
  createdAt: string;
  lastOpenedAt?: string;
  expiresAt: string;
  photos: Photo[];
  selectedFileNames: string[];
  submittedAt?: string;
  revisionRound: number;
  submissionHistory: SubmissionHistory[];
  /** Supabase auth user id of the photographer who owns this project */
  ownerId?: string;
  /** Studio branding snapshot shown to the client (they never see the FG's localStorage) */
  studioName?: string;
  studioWhatsapp?: string;
  waTemplate?: string;
  accentColor?: string;
}

export interface StudioProfile {
  studioName: string;
  whatsapp: string;
  logoUrl?: string;
  accentColor: string;
  waTemplate: string;
  googleApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface MatchingResult {
  totalTarget: number;
  matched: string[];
  missing: string[];
  copiedCount: number;
  errors: string[];
}

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}
