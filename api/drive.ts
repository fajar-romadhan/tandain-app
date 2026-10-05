export interface DriveScrapeResult {
  folderTitle: string;
  activeFolder: string;
  subfolders: Array<{ id: string; name: string }>;
  photos: Array<{
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    aspectRatio: number;
  }>;
}

export async function scrapeFolder(folderId: string): Promise<{
  folderTitle: string;
  subfolders: Array<{ id: string; name: string }>;
  photos: Array<{
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    aspectRatio: number;
  }>;
}> {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!res.ok) {
    throw new Error(`Google Drive merespon dengan status ${res.status}. Pastikan link benar.`);
  }

  const html = await res.text();

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const folderTitle = titleMatch ? titleMatch[1].replace(' - Google Drive', '').trim() : '';

  if (html.includes('accounts.google.com/ServiceLogin') && !html.includes('_DRIVE_ivd')) {
    throw new Error(
      'Folder Google Drive ini masih privat. Mohon ubah akses folder menjadi "Siapa saja yang memiliki link" di Google Drive.'
    );
  }

  const match = html.match(/window\[\x27_DRIVE_ivd\x27\]\s*=\s*\x27(.*?)\x27;/);
  if (!match) {
    throw new Error(
      'Format folder Google Drive tidak terbaca. Pastikan folder disetel ke "Siapa saja yang memiliki link".'
    );
  }

  const raw = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  const json = JSON.parse(unescaped);
  const items = json[0] || [];

  const subfolders: Array<{ id: string; name: string }> = [];
  const photos: Array<{
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    aspectRatio: number;
  }> = [];

  for (const it of items) {
    const id = it[0];
    const name = it[2];
    const mime = it[3] || '';
    if (mime === 'application/vnd.google-apps.folder') {
      subfolders.push({ id, name });
    } else if (
      mime.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|heic)$/i.test(name)
    ) {
      photos.push({
        id,
        name,
        url: `https://lh3.googleusercontent.com/d/${id}=w1200`,
        thumbnailUrl: `https://lh3.googleusercontent.com/d/${id}=w400`,
        aspectRatio: 1.5,
      });
    }
  }

  return { folderTitle, subfolders, photos };
}

export async function smartResolveDriveFolder(
  folderId: string,
  preferredSubfolderId?: string
): Promise<DriveScrapeResult> {
  const root = await scrapeFolder(folderId);

  // If user requested a specific subfolder
  if (preferredSubfolderId) {
    const sub = await scrapeFolder(preferredSubfolderId);
    const subMeta = root.subfolders.find((s) => s.id === preferredSubfolderId);
    return {
      folderTitle: root.folderTitle,
      activeFolder: subMeta?.name || sub.folderTitle,
      subfolders: root.subfolders,
      photos: sub.photos,
    };
  }

  // If root folder already contains direct photos, use them!
  if (root.photos.length > 0) {
    return {
      folderTitle: root.folderTitle,
      activeFolder: root.folderTitle,
      subfolders: root.subfolders,
      photos: root.photos,
    };
  }

  // If root has subfolders, pick the most appropriate one
  if (root.subfolders.length > 0) {
    const sorted = [...root.subfolders].sort((a, b) => {
      const score = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('original')) return 10;
        if (n.includes('preview')) return 9;
        if (n.includes('jpg') || n.includes('jpeg')) return 8;
        if (n.includes('seleksi') || n.includes('pilih')) return 7;
        if (n.includes('mentahan')) return 6;
        if (n.includes('edit')) return 4;
        return 1;
      };
      return score(b.name) - score(a.name);
    });

    const chosen = sorted[0];
    const subResult = await scrapeFolder(chosen.id);

    return {
      folderTitle: root.folderTitle,
      activeFolder: chosen.name,
      subfolders: root.subfolders,
      photos: subResult.photos,
    };
  }

  throw new Error('Folder Google Drive ini kosong, tidak ditemukan file foto JPG/PNG.');
}

// Vercel Serverless Handler
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { folderId, subfolderId } = req.query || {};
    if (!folderId || typeof folderId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Parameter folderId wajib diisi.',
      });
    }

    const result = await smartResolveDriveFolder(folderId, subfolderId as string | undefined);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('Drive resolver error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Gagal memproses folder Google Drive.',
    });
  }
}
