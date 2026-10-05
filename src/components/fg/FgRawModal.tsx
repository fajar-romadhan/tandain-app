import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  FolderOpen,
  Download,
  Loader2,
  AlertCircle,
  FileArchive,
  HardDrive,
} from 'lucide-react';
import { Modal } from '../Modal';
import {
  isFileSystemAccessSupported,
  scanFolderChrome,
  matchLocalFilesFromList,
  downloadMatchedAsZip,
  type CopyProgress,
  type MatchedFile,
} from '../../services/rawMatcher';

interface FgRawModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFileNames: string[];
  clientName: string;
}

type Step = 'idle' | 'scanning' | 'scanned' | 'zipping' | 'done' | 'error';

export const FgRawModal: React.FC<FgRawModalProps> = ({
  isOpen,
  onClose,
  selectedFileNames,
  clientName,
}) => {
  const [targetType, setTargetType] = useState<'raw' | 'jpg' | 'both'>('raw');
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
      const res = await scanFolderChrome(selectedFileNames, targetType, setProgress);
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

  // ─── SAFARI (webkitdirectory) ──────────────────────────────────────────────
  const handleSafariFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setStep('scanning');
    setErrorMsg(null);
    try {
      const res = matchLocalFilesFromList(files, selectedFileNames, targetType);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ambil File RAW Pilihan Klien" maxWidth="520px">
      <div>
        {/* ─── KETERANGAN SIMPEL ─────────────────────────────────────────────── */}
        <div
          style={{
            backgroundColor: '#F0F7FF',
            border: '1px solid #BFDBFE',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <HardDrive size={22} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E3A8A', marginBottom: '4px' }}>
              Cara kerja: 3 langkah mudah
            </p>
            <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>
              <li>Klik tombol <b>Pilih Folder</b> → arahkan ke folder foto di laptop/harddisk/SD card</li>
              <li>Web otomatis mencocokkan <b>{selectedFileNames.length} foto</b> pilihan klien</li>
              <li>Klik <b>Download ZIP</b> → 1 file ZIP langsung turun ke komputer kamu 🎉</li>
            </ol>
          </div>
        </div>

        {/* ─── FORMAT FILE TARGET ─────────────────────────────────────────────── */}
        {(step === 'idle' || step === 'error') && (
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              📂 Saya ingin download format:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(['raw', 'jpg', 'both'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTargetType(t)}
                  style={{
                    height: '40px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    border: targetType === t ? '2px solid #2563EB' : '1.5px solid var(--border)',
                    backgroundColor: targetType === t ? '#EFF6FF' : 'var(--surface)',
                    color: targetType === t ? '#2563EB' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t === 'raw' ? '📷 RAW Saja' : t === 'jpg' ? '🖼️ JPG Saja' : '📦 RAW + JPG'}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              {targetType === 'raw'
                ? 'File .CR3 .ARW .NEF .DNG .RAF dll — untuk diedit di Lightroom/Capture One'
                : targetType === 'jpg'
                ? 'File .JPG/.JPEG — ukuran lebih kecil, cocok untuk cetak langsung'
                : 'Download file RAW + JPG sekaligus dalam 1 file ZIP'}
            </p>
          </div>
        )}

        {/* ─── STEP: IDLE — TOMBOL PILIH FOLDER ─────────────────────────────── */}
        {step === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Chrome/Edge */}
            {supported && (
              <button
                type="button"
                onClick={handleScanChrome}
                style={{
                  width: '100%',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 18px rgba(37, 99, 235, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                <FolderOpen size={22} /> Pilih Folder Foto di Laptop
              </button>
            )}

            {/* Safari / Firefox */}
            {!supported && (
              <>
                <input
                  ref={safariInputRef}
                  type="file"
                  // @ts-expect-error webkitdirectory is standard in Safari/WebKit
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
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 18px rgba(37, 99, 235, 0.3)',
                    cursor: 'pointer',
                  }}
                >
                  <FolderOpen size={22} /> Pilih Folder Foto di Laptop
                </button>
              </>
            )}

            {/* Safari juga bisa di Chrome (sebagai fallback) */}
            {supported && (
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
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  <FolderOpen size={16} /> Atau pilih folder via dialog file biasa (Safari / Firefox)
                </button>
              </>
            )}

            <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              🔒 File kamu <b>tidak dikirim ke server</b> — semua proses terjadi 100% di browser sendiri
            </p>
          </div>
        )}

        {/* ─── STEP: SCANNING ────────────────────────────────────────────────── */}
        {step === 'scanning' && (
          <div style={{ textAlign: 'center', padding: '28px 20px' }}>
            <Loader2 size={40} color="#2563EB" className="animate-spin" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
              {progress?.statusText || 'Sedang membaca folder kamu...'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Mohon tunggu, web sedang mencocokkan file RAW pilihan klien
            </p>
          </div>
        )}

        {/* ─── STEP: SCANNED — HASIL + TOMBOL DOWNLOAD ZIP ──────────────────── */}
        {step === 'scanned' && (
          <div>
            {/* Result card */}
            <div
              style={{
                backgroundColor: matched.length > 0 ? '#F0FDF4' : '#FFFBEB',
                border: `1.5px solid ${matched.length > 0 ? '#86EFAC' : '#FCD34D'}`,
                borderRadius: '16px',
                padding: '18px 20px',
                marginBottom: '18px',
              }}
            >
              {matched.length > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <CheckCircle2 size={24} color="#16A34A" />
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#15803D' }}>
                        {matched.length} file siap didownload!
                      </p>
                      <p style={{ fontSize: '12.5px', color: '#4B5563' }}>
                        Total ukuran: <b>{formatBytes(totalBytes)}</b>
                      </p>
                    </div>
                  </div>
                  {missing.length > 0 && (
                    <p style={{ fontSize: '12px', color: '#B45309', backgroundColor: '#FFFBEB', padding: '8px 12px', borderRadius: '8px', marginTop: '8px' }}>
                      ⚠️ {missing.length} foto tidak ditemukan di folder ini:{' '}
                      {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3} lainnya` : ''}
                    </p>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertCircle size={22} color="#D97706" />
                  <div>
                    <p style={{ fontSize: '14.5px', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                      File tidak ditemukan di folder ini
                    </p>
                    <p style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: 1.5 }}>
                      Kemungkinan foto ada di subfolder kamera (misal <b>100CANON</b>, <b>DCIM</b>). Coba pilih folder tersebut langsung.
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
                    height: '58px',
                    borderRadius: '14px',
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 20px rgba(22, 163, 74, 0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <FileArchive size={24} /> Download {matched.length} File sebagai ZIP
                </button>
              )}
              <button
                type="button"
                onClick={resetState}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1px solid var(--border)',
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
          <div>
            <div style={{ textAlign: 'center', padding: '12px 20px 20px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <Loader2 size={32} color="#2563EB" className="animate-spin" />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Sedang membuat file ZIP...
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                {progress?.statusText || 'Mohon tunggu, jangan tutup jendela ini'}
              </p>
            </div>
            {progress && progress.total > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Progres</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#2563EB' }}>
                    {progress.current}/{progress.total}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '9999px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                      height: '100%',
                      backgroundColor: '#2563EB',
                      borderRadius: '9999px',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP: DONE ────────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 20px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Download size={36} color="#16A34A" />
            </div>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#15803D', marginBottom: '6px' }}>
              ZIP berhasil didownload! 🎉
            </p>
            <p style={{ fontSize: '13.5px', color: '#4B5563', marginBottom: '24px', lineHeight: 1.5 }}>
              File <b>RAW_Pilihan_{(clientName || 'Klien').replace(/[^a-zA-Z0-9_-]/g, '_')}</b> sudah tersimpan di folder Download kamu.
            </p>
            <button
              type="button"
              onClick={resetState}
              className="pill-btn pill-btn-secondary"
              style={{ width: '100%', height: '44px' }}
            >
              Proses Klien Lain
            </button>
          </div>
        )}

        {/* ─── STEP: ERROR ───────────────────────────────────────────────────── */}
        {step === 'error' && errorMsg && (
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: '#FFF0F0',
                border: '1px solid #FECACA',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#991B1B', lineHeight: 1.5 }}>{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={resetState}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <FolderOpen size={18} /> Coba Lagi
            </button>
          </div>
        )}

        {/* Footer close */}
        {(step === 'idle' || step === 'error') && (
          <button
            onClick={onClose}
            className="pill-btn pill-btn-ghost"
            style={{ width: '100%', height: '40px', marginTop: '8px', fontSize: '13px' }}
          >
            Tutup
          </button>
        )}
      </div>
    </Modal>
  );
};
