import type { Photo, Project, StudioProfile } from '../types';

export const DEFAULT_STUDIO: StudioProfile = {
  studioName: 'Budi Visual Story',
  whatsapp: '6281234567890',
  logoUrl: '',
  accentColor: '#1D1D1F',
  waTemplate: `Halo kak {client_name}! Pilihan foto kamu sudah masuk di Tandain.
Total: {total_selected} dari {quota} foto.
Status: Siap diproses untuk tahap editing RAW! ✨`,
};

export const SAMPLE_GRADUATION_PHOTOS: Photo[] = [
  {
    id: 'wisuda-01',
    name: 'RANI_WISUDA_001.JPG',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 1.5,
  },
  {
    id: 'wisuda-02',
    name: 'RANI_WISUDA_002.JPG',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.67,
  },
  {
    id: 'wisuda-03',
    name: 'RANI_WISUDA_003.JPG',
    url: 'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.8,
  },
  {
    id: 'wisuda-04',
    name: 'RANI_WISUDA_004.JPG',
    url: 'https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 1.33,
  },
  {
    id: 'wisuda-05',
    name: 'RANI_WISUDA_005.JPG',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.75,
  },
  {
    id: 'wisuda-06',
    name: 'RANI_WISUDA_006.JPG',
    url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 1.5,
  },
  {
    id: 'wisuda-07',
    name: 'RANI_WISUDA_007.JPG',
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 1.4,
  },
  {
    id: 'wisuda-08',
    name: 'RANI_WISUDA_008.JPG',
    url: 'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.7,
  },
  {
    id: 'wisuda-09',
    name: 'RANI_WISUDA_009.JPG',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.67,
  },
  {
    id: 'wisuda-10',
    name: 'RANI_WISUDA_010.JPG',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.8,
  },
  {
    id: 'wisuda-11',
    name: 'RANI_WISUDA_011.JPG',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.67,
  },
  {
    id: 'wisuda-12',
    name: 'RANI_WISUDA_012.JPG',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.75,
  }
];

export const SAMPLE_WEDDING_PHOTOS: Photo[] = [
  {
    id: 'wed-01',
    name: 'IMG_4820.JPG',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 1.5,
  },
  {
    id: 'wed-02',
    name: 'IMG_4821.JPG',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.67,
  },
  {
    id: 'wed-03',
    name: 'IMG_4822.JPG',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 1.33,
  },
  {
    id: 'wed-04',
    name: 'IMG_4823.JPG',
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 1.5,
  },
  {
    id: 'wed-05',
    name: 'IMG_4824.JPG',
    url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.75,
  },
  {
    id: 'wed-06',
    name: 'IMG_4825.JPG',
    url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.67,
  },
  {
    id: 'wed-07',
    name: 'IMG_4826.JPG',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 1.4,
  },
  {
    id: 'wed-08',
    name: 'IMG_4827.JPG',
    url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.7,
  },
  {
    id: 'wed-09',
    name: 'IMG_4828.JPG',
    url: 'https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 1.5,
  },
  {
    id: 'wed-10',
    name: 'IMG_4829.JPG',
    url: 'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.67,
  },
  {
    id: 'wed-11',
    name: 'IMG_4830.JPG',
    url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 1.4,
  },
  {
    id: 'wed-12',
    name: 'IMG_4831.JPG',
    url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=1200&auto=format&fit=crop',
    aspectRatio: 0.75,
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-rani-wisuda',
    slug: 'rani-wisuda',
    clientName: 'Rani — Wisuda UI',
    sessionDate: '2026-10-04',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1RaniWisudaSampleFolder2026',
    driveFolderId: '1RaniWisudaSampleFolder2026',
    quota: 5,
    pin: '',
    hasWatermark: false,
    status: 'lagi_milih',
    locked: false,
    activeSelectorDeviceId: 'dev-rani-hp',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastOpenedAt: new Date(Date.now() - 60000 * 12).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    photos: SAMPLE_GRADUATION_PHOTOS,
    selectedFileNames: ['RANI_WISUDA_002.JPG', 'RANI_WISUDA_005.JPG'],
    revisionRound: 1,
    submissionHistory: [],
  },
  {
    id: 'proj-andi-rina',
    slug: 'andi-rina-wedding',
    clientName: 'Andi & Rina — Wedding Day',
    sessionDate: '2026-09-28',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1AndiRinaWeddingPlataran2026',
    driveFolderId: '1AndiRinaWeddingPlataran2026',
    quota: 6,
    pin: '2026',
    hasWatermark: true,
    status: 'udah_kirim',
    locked: true,
    activeSelectorDeviceId: 'dev-rina-iphone',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastOpenedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 27).toISOString(),
    photos: SAMPLE_WEDDING_PHOTOS,
    selectedFileNames: [
      'IMG_4820.JPG',
      'IMG_4821.JPG',
      'IMG_4823.JPG',
      'IMG_4825.JPG',
      'IMG_4826.JPG',
      'IMG_4829.JPG',
    ],
    revisionRound: 1,
    submissionHistory: [
      {
        round: 1,
        fileNames: [
          'IMG_4820.JPG',
          'IMG_4821.JPG',
          'IMG_4823.JPG',
          'IMG_4825.JPG',
          'IMG_4826.JPG',
          'IMG_4829.JPG',
        ],
        submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: 'proj-dimas-ayu',
    slug: 'dimas-ayu-prewed',
    clientName: 'Dimas & Ayu — Prewedding Bromo',
    sessionDate: '2026-09-20',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1DimasAyuPreweddingSample',
    driveFolderId: '1DimasAyuPreweddingSample',
    quota: 8,
    hasWatermark: false,
    status: 'selesai',
    locked: true,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 16).toISOString(),
    photos: SAMPLE_WEDDING_PHOTOS.slice(0, 10),
    selectedFileNames: ['IMG_4821.JPG', 'IMG_4824.JPG', 'IMG_4826.JPG', 'IMG_4827.JPG'],
    revisionRound: 1,
    submissionHistory: [],
  }
];
