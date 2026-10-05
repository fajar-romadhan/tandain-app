import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  FolderOpen,
  Download,
  Loader2,
  AlertCircle,
  FileArchive,
  HardDrive,
  Info,
} from 'lucide-react';
import { Modal } from '../Modal';
import {
  isFileSystemAccessSupported,
  downloadMatchedAsZip,
  matchLocalFilesFromList,
  type CopyProgress,
  type MatchedFile,
} from '../../services/rawMatcher';
import { RAW_EXTENSIONS } from '../../services/rawMatcher';

interface FgRawModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFileNames: string[];
  clientName: string;
}

type Step = 'idle' | 'scanning' | 'scanned' | 'zipping' | 'done' | 'error';

// ─── Deep recursive Chrome scan (up to 5 subfolder levels) ───────────────────
async function scanFolderRawDeep(
  selectedFileNames: string[],
  onProgress?: (p: CopyProgress) => void,
): Promise<{ matched: MatchedFile[]; missing: string[]; totalBytes: number }> {
  // @ts-expect-error showDirectoryPicker is available in Chrome/Edge
  const dirHandle = await window.showDirectoryPicker({ mode: 'read', id: 'tandain_raw_scan' });

  onProgress?.({ current: 0, total: selectedFileNames.length, currentFileName: '', statusText: 'Membaca isi folder...', phase: 'scan' });

  // Build a flat index of ALL files recursively (up to 5 subfolder levels deep)
  const fileIndex = new Map<string, File>();

  async function indexDir(handle: FileSystemDirectoryHandle, depth: number) {
    for await (const [, entry] of (handle as any).entries()) {
      if (entry.kind === 'file') {
        const f: File = await entry.getFile();
        fileIndex.set(f.name.toLowerCase(), f);
      } else if (entry.kind === 'directory' && depth < 5) {
        await indexDir(entry, depth + 1);
      }
    }
  }
  await indexDir(dirHandle, 0);

  onProgress?.({ current: 0, total: selectedFileNames.length, currentFileName: '', statusText: `Ditemukan ${fileIndex.size} file. Mencocokkan pilihan klien...`, phase: 'scan' });

  // Match: for each JPG name the client chose, find the RAW file with the same base name
  const matched: MatchedFile[] = [];
  const missing: string[] = [];
  let totalBytes = 0;
  const total = selectedFileNames.length;

  for (let i = 0; i < total; i++) {
    const sel = selectedFileNames[i];
    const base = sel.includes('.') ? sel.substring(0, sel.lastIndexOf('.')).toLowerCase() : sel.toLowerCase();

    let found: MatchedFile | null = null;

    for (const [lowerName, file] of fileIndex.entries()) {
      const ext = (lowerName.split('.').pop() || '').toLowerCase();
      const candidateBase = lowerName.includes('.')
        ? lowerName.substring(0, lowerName.lastIndexOf('.'))
        : lowerName;

      if (candidateBase !== base) continue;

      if (RAW_EXTENSIONS.includes(ext)) {
        found = { file, name: file.name, size: file.size, extension: ext };
        totalBytes += file.size;
        break; // Take the first RAW match per base name
      }
    }

    if (found) {
      matched.push(found);
      onProgress?.({ current: i + 1, total, currentFileName: found.name, statusText: `Mencocokkan... ${i + 1}/${total}`, phase: 'scan' });
    } else {
      missing.push(sel);
    }
  }

  return { matched, missing, totalBytes };
}

export const FgRawModal: React.FC<FgRawModalProps> = ({
  isOpen,
  onClose,
  selectedFileNames,
  clientName,
}) => {
  const [step, setStep] = useState<Step>('idle');
  const [progress, setProgress] = useState<CopyProgress | null>(null);
  const [matched, setMatched] = useState<MatchedFile[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const safariInputRef = useRef<HTMLInputElement | null>(null);

  const supported = isFileSystemAccessSupported();

  const resetState = () => {
    setStep('idle');
    setProgress(null);
    setMatched([]);
    setMissing([]);
    setTotalBytes(0);
    setErrorMsg(null);
  };

  // ─── CHROME/EDGE ───────────────────────────────────────────────────────────
  const handleScanChrome = async () => {
    setStep('scanning');
    setErrorMsg(null);
    try {
      const res = await scanFolderRawDeep(selectedFileNames, setProgress);
      setMatched(res.matched);
      setMissing(res.missing);
      setTotalBytes(res.totalBytes);
      setStep('scanned');
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setStep('idle');
      } else {
        setErrorMsg(err?.message || 'Gagal membaca folder.');
        setStep('error');
      }
    }
  };

  // ─── SAFARI / macOS Finder ─────────────────────────────────────────────────
  const handleSafariFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setStep('scanning');
    setErrorMsg(null);
    try {
      // Only match RAW files (ignore JPG even if uploaded together)
      const res = matchLocalFilesFromList(files, selectedFileNames, 'raw');
      setMatched(res.matched);
      setMissing(res.missing);
      setTotalBytes(res.totalBytes);
      setStep('scanned');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal membaca folder.');
      setStep('error');
    }
  };

  // ─── DOWNLOAD ZIP ──────────────────────────────────────────────────────────
  const handleDownloadZip = async () => {
    if (matched.length === 0) return;
    setStep('zipping');
    try {
      await downloadMatchedAsZip(matched, clientName, setProgress);
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal membuat file ZIP.');
      setStep('error');
    }
  };

  const formatBytes = (b: number) => {
    if (b >= 1024 * 1024 * 1024) return (b / 1024 / 1024 / 1024).toFixed(1) + ' GB';
    return (b / 1024 / 1024).toFixed(0) + ' MB';
  };

  const progressPct = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📥 Download File RAW Pilihan Klien" maxWidth="520px">
      <div>

        {/* ─── STEP: IDLE ──────────────────────────────────────────────────── */}
        {step === 'idle' && (
          <div>
            {/* How it works card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)',
                border: '1.5px solid #BFDBFE',
                borderRadius: '16px',
                padding: '16px 18px',
                marginBottom: '20px',
              }}
            >
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#1D4ED8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={15} /> Cara kerja — hanya 2 langkah:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { num: '1', text: <>Klik <b>"Pilih Folder RAW"</b> → arahkan ke folder RAW kamu di laptop / harddisk / SD card</> },
                  { num: '2', text: <>Web otomatis mencocokkan <b>{selectedFileNames.length} file pilihan klien</b> → muncul tombol <b>Download ZIP</b> 🎉</> },
                ].map(({ num, text }) => (
                  <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: '#2563EB', color: '#FFFFFF',
                      fontSize: '12px', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: '1px',
                    }}>{num}</div>
                    <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips for FG */}
            <div style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '12px',
              padding: '11px 14px',
              marginBottom: '20px',
              fontSize: '12.5px',
              color: '#78350F',
              lineHeight: 1.6,
            }}>
              💡 <b>Tips FG:</b> Kalau kamu punya 2 folder terpisah (folder JPG + folder RAW), pilih folder <b>RAW</b>-nya aja. Web akan otomatis mencari nama file yang cocok dengan pilihan klien.
            </div>

            {/* Scan security note */}
            <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: '14px' }}>
              🔒 File kamu <b>tidak dikirim ke server</b> — semua diproses 100% di browser lokal
            </p>

            {/* Notice for Safari / unsupported File System Access API */}
            {!supported && (
              <div
                style={{
                  backgroundColor: '#FEF3C7',
                  border: '1.5px solid #FCD34D',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                  lineHeight: 1.55,
                  color: '#78350F',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 800, color: '#B45309', marginBottom: '6px' }}>
                  <AlertCircle size={16} /> Info Kompatibilitas Safari (Apple WebKit)
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px' }}>
                  Apple Safari memiliki kebijakan privasi yang membatasi akses baca folder lokal otomatis (<i>File System Access API</i>).
                </p>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px' }}>
                  <p style={{ fontWeight: 800, margin: '0 0 5px 0', color: '#92400E' }}>💡 Rekomendasi Alur Fotografer di Mac:</p>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <li>
                      <b>Google Chrome / Microsoft Edge di Mac (Paling Cepat):</b> Buka dashboard Tandain via Chrome/Edge untuk auto-match 1-klik tanpa kendala memori.
                    </li>
                    <li>
                      <b>Salin Nama File / Export TXT:</b> Di dashboard, klik <b>"Salin Nama File"</b> atau <b>"Export TXT"</b>, lalu paste ke filter pencarian <b>Finder Mac (Cmd + F)</b> atau <b>Lightroom</b>.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Chrome/Edge primary button */}
              {supported && (
                <button
                  type="button"
                  onClick={handleScanChrome}
                  style={{
                    width: '100%',
                    height: '58px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '0.2px',
                  }}
                >
                  <FolderOpen size={22} /> Pilih Folder RAW
                </button>
              )}

              {/* Safari / webkitdirectory fallback */}
              <>
                <input
                  ref={safariInputRef}
                  type="file"
                  // @ts-expect-error webkitdirectory
                  webkitdirectory=""
                  directory=""
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleSafariFolderSelect}
                />
                <button
                  type="button"
                  onClick={() => safariInputRef.current?.click()}
                  style={{
                    width: '100%',
                    height: supported ? '44px' : '56px',
                    borderRadius: '14px',
                    background: supported ? 'var(--surface)' : 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                    backgroundColor: supported ? 'var(--surface)' : '#1D4ED8',
                    border: supported ? '1.5px solid var(--border)' : 'none',
                    color: supported ? 'var(--text-secondary)' : '#FFFFFF',
                    fontSize: supported ? '13px' : '15px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: supported ? 'none' : '0 4px 16px rgba(37, 99, 235, 0.28)',
                  }}
                >
                  <HardDrive size={supported ? 15 : 20} />
                  {supported
                    ? 'Alternatif: pilih folder via dialog biasa (Safari / macOS)'
                    : 'Coba Pilih Folder RAW via Safari'}
                </button>
                {!supported && (
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', margin: '4px 0 0 0' }}>
                    *Pada Safari macOS, pastikan menyetujui izin baca folder saat diminta sistem Finder.
                  </p>
                )}
              </>
            </div>

            <button
              onClick={onClose}
              className="pill-btn pill-btn-ghost"
              style={{ width: '100%', height: '40px', marginTop: '12px', fontSize: '13px' }}
            >
              Tutup
            </button>
          </div>
        )}

        {/* ─── STEP: SCANNING ────────────────────────────────────────────────── */}
        {step === 'scanning' && (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Loader2 size={36} color="#2563EB" className="animate-spin" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>
              {progress?.statusText || 'Membaca folder kamu...'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Mencocokkan {selectedFileNames.length} nama file pilihan klien
            </p>
            {progress && progress.total > 0 && (
              <div style={{ marginTop: '18px' }}>
                <div style={{ width: '100%', height: '6px', borderRadius: '9999px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progressPct}%`, height: '100%',
                    backgroundColor: '#2563EB', borderRadius: '9999px',
                    transition: 'width 0.2s ease',
                  }} />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                  {progress.current} / {progress.total} file diproses
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP: SCANNED ─────────────────────────────────────────────────── */}
        {step === 'scanned' && (
          <div>
            {/* Result summary */}
            <div style={{
              backgroundColor: matched.length > 0 ? '#F0FDF4' : '#FFFBEB',
              border: `2px solid ${matched.length > 0 ? '#86EFAC' : '#FCD34D'}`,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
            }}>
              {matched.length > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <CheckCircle2 size={28} color="#16A34A" />
                    <div>
                      <p style={{ fontSize: '17px', fontWeight: 900, color: '#15803D' }}>
                        {matched.length} file RAW siap didownload!
                      </p>
                      <p style={{ fontSize: '13px', color: '#4B5563', marginTop: '2px' }}>
                        Total ukuran: <b>{formatBytes(totalBytes)}</b>
                      </p>
                    </div>
                  </div>

                  {/* File list preview (first 5) */}
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                  }}>
                    {matched.slice(0, 8).map((m) => (
                      <p key={m.name} style={{ fontSize: '12px', color: '#374151', lineHeight: 1.7 }}>
                        📷 {m.name} <span style={{ color: '#6B7280' }}>({(m.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </p>
                    ))}
                    {matched.length > 8 && (
                      <p style={{ fontSize: '12px', color: '#2563EB', fontWeight: 700 }}>
                        +{matched.length - 8} file lainnya...
                      </p>
                    )}
                  </div>

                  {missing.length > 0 && (
                    <div style={{
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginTop: '10px',
                    }}>
                      <p style={{ fontSize: '12px', color: '#92400E', fontWeight: 700, marginBottom: '4px' }}>
                        ⚠️ {missing.length} foto tidak ditemukan di folder ini:
                      </p>
                      <p style={{ fontSize: '11.5px', color: '#78350F' }}>
                        {missing.slice(0, 4).join(', ')}{missing.length > 4 ? ` ...+${missing.length - 4} lainnya` : ''}
                      </p>
                      <p style={{ fontSize: '11px', color: '#B45309', marginTop: '4px' }}>
                        Kemungkinan ada di subfolder lain. Coba pilih folder induk yang lebih luas.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertCircle size={24} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#92400E', marginBottom: '6px' }}>
                      File RAW tidak ditemukan di folder ini
                    </p>
                    <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>
                      Pastikan kamu memilih folder yang berisi file <b>.CR3 / .CR2 / .ARW / .NEF / .DNG / .RAF</b> dll, bukan folder JPG.<br />
                      Kalau foto ada di subfolder kamera (<b>100CANON</b>, <b>DCIM</b>), coba pilih folder induknya.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {matched.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  style={{
                    width: '100%',
                    height: '60px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
                    color: '#FFFFFF',
                    fontSize: '17px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.40)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <FileArchive size={26} /> Download {matched.length} File RAW (ZIP)
                </button>
              )}
              <button
                type="button"
                onClick={resetState}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1.5px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <FolderOpen size={16} /> Pilih Folder Lain
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: ZIPPING ─────────────────────────────────────────────────── */}
        {step === 'zipping' && (
          <div style={{ textAlign: 'center', padding: '24px 20px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Loader2 size={36} color="#16A34A" className="animate-spin" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>
              Membuat file ZIP...
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {progress?.statusText || 'Jangan tutup jendela ini ya!'}
            </p>
            {progress && progress.total > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Progres</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#16A34A' }}>
                    {progressPct}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', borderRadius: '9999px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progressPct}%`, height: '100%',
                    background: 'linear-gradient(90deg, #16A34A, #22C55E)',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                  {progress.current} / {progress.total} file dikemas
                </p>
              </>
            )}
          </div>
        )}

        {/* ─── STEP: DONE ────────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '28px 20px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 8px 24px rgba(22, 163, 74, 0.25)',
            }}>
              <Download size={40} color="#16A34A" />
            </div>
            <p style={{ fontSize: '20px', fontWeight: 900, color: '#15803D', marginBottom: '8px' }}>
              ZIP berhasil didownload! 🎉
            </p>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.6 }}>
              File <b>RAW_Pilihan_{(clientName || 'Klien').replace(/[^a-zA-Z0-9_-]/g, '_')}</b> sudah tersimpan di folder <b>Downloads</b> kamu.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
              Kamu bisa langsung buka dan edit di folder master laptopmu ✨
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={resetState}
                className="pill-btn pill-btn-secondary"
                style={{ width: '100%', height: '46px', fontSize: '14px' }}
              >
                Proses Klien Lain
              </button>
              <button
                onClick={onClose}
                className="pill-btn pill-btn-ghost"
                style={{ width: '100%', height: '40px', fontSize: '13px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: ERROR ───────────────────────────────────────────────────── */}
        {step === 'error' && errorMsg && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              padding: '16px 18px',
              borderRadius: '14px',
              backgroundColor: '#FFF0F0',
              border: '1.5px solid #FECACA',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <AlertCircle size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#991B1B', marginBottom: '4px' }}>
                  Terjadi Kesalahan
                </p>
                <p style={{ fontSize: '13px', color: '#991B1B', lineHeight: 1.5 }}>{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetState}
              style={{
                width: '100%', height: '48px', borderRadius: '12px',
                backgroundColor: '#2563EB', color: '#FFFFFF',
                fontSize: '14px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', border: 'none', cursor: 'pointer',
              }}
            >
              <FolderOpen size={18} /> Coba Lagi
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
};
