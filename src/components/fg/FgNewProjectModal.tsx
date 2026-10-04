import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import { Modal } from '../Modal';
import { extractDriveFolderId, getPhotosForDriveFolder } from '../../services/drive';
import type { Project } from '../../types';

interface FgNewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export const FgNewProjectModal: React.FC<FgNewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
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

  const handleCreate = (e: React.FormEvent) => {
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

    const slug = clientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6);

    const photos = getPhotosForDriveFolder(folderId, clientName);

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
      photos,
      selectedFileNames: [],
      revisionRound: 1,
      submissionHistory: [],
    };

    onProjectCreated(newProject);
    onClose();
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
            onChange={(e) => {
              setDriveUrl(e.target.value);
              setErrorMsg('');
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
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Pastikan akses folder diatur ke "Siapa saja yang memiliki link".
          </p>
        </div>

        {/* Client Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Nama Client / Project*
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Misal: Rani — Wisuda UI atau Andi & Rina Wedding"
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
            Batas Kuota Foto (Paket)*
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>foto yang boleh dipilih</span>
          </div>
        </div>

        {/* Advanced Options Accordion */}
        <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            <span>Opsi Lanjutan (PIN, Tanggal, Watermark)</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Session Date */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
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
          className="pill-btn pill-btn-primary"
          style={{ width: '100%', height: '48px', fontSize: '16px' }}
        >
          <PlusCircle size={18} /> Buat Project & Dapatkan Link
        </button>
      </form>
    </Modal>
  );
};
