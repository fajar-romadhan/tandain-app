import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, PlusCircle, FolderOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../Modal';
import {
  extractDriveFolderId,
  getPhotosForDriveFolder,
  detectDriveFolder,
  scanLocalPreviewFolder,
  type SmartDriveFolderInfo,
} from '../../services/drive';
import type { Project, StudioProfile, Photo } from '../../types';

interface FgNewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  studio?: StudioProfile;
}

export const FgNewProjectModal: React.FC<FgNewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
  studio: _studio,
}) => {
  const [driveUrl, setDriveUrl] = useState('');
  const [clientName, setClientName] = useState('');
  const [quota, setQuota] = useState<number>(50);
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState<SmartDriveFolderInfo | null>(null);
  const [selectedSubfolderId, setSelectedSubfolderId] = useState<string>('');
  const [localPhotos, setLocalPhotos] = useState<Photo[]>([]);
  const detectTimeoutRef = useRef<any>(null);

  const triggerDetect = async (url: string, subId?: string) => {
    const fId = extractDriveFolderId(url);
    if (!fId) {
      setDetectedInfo(null);
      return;
    }

    setIsDetecting(true);
    setErrorMsg('');

    try {
      const info = await detectDriveFolder(fId, subId);
      setDetectedInfo(info);
      if (!subId && info.subfolders.length > 0) {
        const activeSub = info.subfolders.find((s) => s.name === info.activeFolder) || info.subfolders[0];
        setSelectedSubfolderId(activeSub.id);
      }
      // Auto-populate client name if currently empty
      if (!clientName.trim() && info.folderTitle) {
        const cleaned = info.folderTitle
          .replace(/^[0-9]+[\.\-\_\s]+/g, '')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setClientName(cleaned.trim());
      }
    } catch (err: any) {
      console.warn('Auto-detect drive error:', err.message);
      setErrorMsg(err.message || 'Gagal membaca folder Google Drive.');
      setDetectedInfo(null);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleDriveUrlChange = (val: string) => {
    setDriveUrl(val);
    setErrorMsg('');

    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
    }

    if (val.trim()) {
      detectTimeoutRef.current = setTimeout(() => {
        triggerDetect(val);
      }, 500);
    } else {
      setDetectedInfo(null);
    }
  };

  const handleScanLocalFolder = async () => {
    try {
      setErrorMsg('');
      const photos = await scanLocalPreviewFolder();
      if (photos.length === 0) {
        setErrorMsg('Tidak ditemukan file foto (JPG/PNG) di folder yang dipilih.');
        return;
      }
      setLocalPhotos(photos);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMsg(err.message || 'Gagal memindai folder lokal.');
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) {
      setErrorMsg('Tolong masukkan link Google Drive publik.');
      return;
    }
    if (!clientName.trim()) {
      setErrorMsg('Nama klien tidak boleh kosong.');
      return;
    }
    if (quota <= 0) {
      setErrorMsg('Kuota foto minimal 1.');
      return;
    }

    const folderId = extractDriveFolderId(driveUrl);
    if (!folderId) {
      setErrorMsg('Format link Google Drive belum valid. Pastikan link berisi folder publik.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      let finalPhotos: Photo[] = [];

      if (localPhotos.length > 0) {
        finalPhotos = localPhotos;
      } else if (detectedInfo && detectedInfo.photos.length > 0) {
        finalPhotos = detectedInfo.photos;
      } else {
        const result = await getPhotosForDriveFolder(folderId, clientName, undefined, selectedSubfolderId);
        finalPhotos = result.photos;
      }

      const slug = clientName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6);

      const newProject: Project = {
        id: 'proj_' + Date.now(),
        slug,
        clientName: clientName.trim(),
        sessionDate: sessionDate || undefined,
        driveFolderUrl: driveUrl.trim(),
        driveFolderId: folderId,
        quota: Number(quota),
        pin: pinEnabled && pinValue.trim() ? pinValue.trim() : undefined,
        hasWatermark: watermarkEnabled,
        status: 'belum_dibuka',
        locked: false,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days
        photos: finalPhotos,
        selectedFileNames: [],
        revisionRound: 1,
        submissionHistory: [],
      };

      onProjectCreated(newProject);
      onClose();
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan saat memproses galeri: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Project Foto Baru" maxWidth="520px">
      <form onSubmit={handleCreate}>
        {/* Drive URL */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Link Folder Google Drive (JPG)*
          </label>
          <input
            type="text"
            required
            value={driveUrl}
            onChange={(e) => handleDriveUrlChange(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (pasted) {
                handleDriveUrlChange(pasted);
              }
            }}
            placeholder="https://drive.google.com/drive/folders/..."
            style={{
              width: '100%',
              height: '46px',
              padding: '0 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              outline: 'none',
              fontSize: '14px',
            }}
          />

          {/* Smart detection indicator */}
          {isDetecting && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
              }}
            >
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Mendeteksi & membaca foto Google Drive otomatis...</span>
            </div>
          )}

          {detectedInfo && !isDetecting && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#E8F5E9',
                border: '1px solid #C8E6C9',
                fontSize: '12.5px',
                color: '#1B5E20',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#2E7D32" />
                  {detectedInfo.photos.length} Foto Siap ({detectedInfo.folderTitle || 'Google Drive'})
                </span>
                {detectedInfo.subfolders.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', color: '#2E7D32' }}>Subfolder:</span>
                    <select
                      value={selectedSubfolderId}
                      onChange={(e) => {
                        setSelectedSubfolderId(e.target.value);
                        triggerDetect(driveUrl, e.target.value);
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #A5D6A7',
                        backgroundColor: '#FFFFFF',
                        color: '#1B5E20',
                        cursor: 'pointer',
                      }}
                    >
                      {detectedInfo.subfolders.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          📁 {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {detectedInfo.photos.length > 0 && (
                <p style={{ margin: '4px 0 0 22px', fontSize: '11px', color: '#388E3C' }}>
                  File: {detectedInfo.photos.slice(0, 3).map((p) => p.name).join(', ')}
                  {detectedInfo.photos.length > 3 ? `, +${detectedInfo.photos.length - 3} lainnya` : ''}
                </p>
              )}
            </div>
          )}

          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
            Pastikan akses folder Google Drive disetel ke "Siapa saja yang memiliki link".
          </p>
        </div>

        {/* Local Folder Scan Option (Zero Upload, 100% Accurate Filenames) */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: localPhotos.length > 0 ? '#E8F5E9' : '#F5F5F7',
            border: localPhotos.length > 0 ? '1px solid #C8E6C9' : '1px solid var(--border-light)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12.5px' }}>
            {localPhotos.length > 0 ? (
              <span style={{ color: '#2E7D32', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> {localPhotos.length} foto lokal terdeteksi
              </span>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>
                Scan nama file JPG langsung dari folder laptop (opsional)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleScanLocalFolder}
            className="pill-btn pill-btn-ghost"
            style={{ height: '32px', fontSize: '12px', padding: '0 12px', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <FolderOpen size={14} /> {localPhotos.length > 0 ? 'Ganti Folder' : 'Pilih Folder'}
          </button>
        </div>

        {/* Client Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Nama Klien / Acara*
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Misal: Wisuda Rani & Aditya / Wedding Sarah"
            style={{
              width: '100%',
              height: '46px',
              padding: '0 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              outline: 'none',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Quota */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Batas Maksimal Foto yang Boleh Dipilih (Kuota)*
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="number"
              min={1}
              max={1000}
              required
              value={quota}
              onChange={(e) => setQuota(Number(e.target.value))}
              style={{
                width: '120px',
                height: '46px',
                padding: '0 14px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                outline: 'none',
                fontSize: '16px',
                fontWeight: 700,
              }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Foto</span>
          </div>
        </div>

        {/* Advanced Accordion */}
        <div style={{ marginBottom: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <span>Pengaturan Lanjutan (Tanggal, PIN, Watermark)</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Date */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Tanggal Sesi Foto
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* PIN Toggle */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="pinToggle"
                  checked={pinEnabled}
                  onChange={(e) => setPinEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <label htmlFor="pinToggle" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Kunci Galeri dengan PIN
                  </label>
                  {pinEnabled && (
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="Ketik PIN (misal 2026)"
                      value={pinValue}
                      onChange={(e) => setPinValue(e.target.value)}
                      style={{
                        marginTop: '8px',
                        width: '180px',
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Watermark Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="wmToggle"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="wmToggle" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Pasang Watermark Nama Studio di Preview Foto
                </label>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <p style={{ color: 'var(--heart)', fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="pill-btn pill-btn-primary"
          style={{ width: '100%', height: '48px', fontSize: '16px', gap: '8px' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Memproses Galeri...
            </>
          ) : (
            <>
              <PlusCircle size={18} /> Buat Project & Dapatkan Link
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};
