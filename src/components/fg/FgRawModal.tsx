import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, HardDrive, Globe } from 'lucide-react';
import { Modal } from '../Modal';
import {
  isFileSystemAccessSupported,
  matchAndCopyLocalFiles,
  type CopyProgress,
} from '../../services/rawMatcher';
import type { MatchingResult } from '../../types';

interface FgRawModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFileNames: string[];
  clientName: string;
}

export const FgRawModal: React.FC<FgRawModalProps> = ({
  isOpen,
  onClose,
  selectedFileNames,
  clientName,
}) => {
  const [targetType, setTargetType] = useState<'raw' | 'jpg' | 'both'>('raw');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<CopyProgress | null>(null);
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supported = isFileSystemAccessSupported();

  const handleStartCopy = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await matchAndCopyLocalFiles(
        selectedFileNames,
        targetType,
        clientName,
        (prog) => setProgress(prog)
      );
      setResult(res);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setErrorMsg(err?.message || 'Terjadi kesalahan saat mengakses folder.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ambil RAW Otomatis dari Laptop" maxWidth="560px">
      <div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.6 }}>
          Kamu <b>tidak perlu mencari satu per satu</b> di folder laptop atau kartu SD. Cukup pilih folder sumber foto, Tandain akan otomatis mencari dan menyalin {selectedFileNames.length} file pilihan klien ke subfolder baru.
        </p>

        {!supported ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: '#FFF4E5',
              border: '1px solid #FFE0B2',
              display: 'flex',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <Globe size={24} color="#B25E00" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#B25E00', marginBottom: '4px' }}>
                Gunakan Google Chrome atau Microsoft Edge
              </p>
              <p style={{ fontSize: '13px', color: '#6E6E73' }}>
                Browser kamu saat ini belum mendukung File System Access API untuk menyalin file lokal secara langsung. Buka Tandain di laptop via Chrome atau Edge ya!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Target file types selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                Format file yang ingin disalin:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setTargetType('raw')}
                  className={`pill-btn ${targetType === 'raw' ? 'pill-btn-primary' : 'pill-btn-secondary'}`}
                  style={{ height: '40px', fontSize: '13px' }}
                >
                  Hanya RAW (.CR3, .ARW...)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('jpg')}
                  className={`pill-btn ${targetType === 'jpg' ? 'pill-btn-primary' : 'pill-btn-secondary'}`}
                  style={{ height: '40px', fontSize: '13px' }}
                >
                  Hanya JPG
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('both')}
                  className={`pill-btn ${targetType === 'both' ? 'pill-btn-primary' : 'pill-btn-secondary'}`}
                  style={{ height: '40px', fontSize: '13px' }}
                >
                  RAW + JPG
                </button>
              </div>
            </div>

            {/* Start Button */}
            {!isProcessing && !result && (
              <button
                onClick={handleStartCopy}
                className="pill-btn pill-btn-primary"
                style={{
                  width: '100%',
                  height: '50px',
                  fontSize: '15px',
                  backgroundColor: '#007AFF',
                  boxShadow: '0 4px 16px rgba(0, 122, 255, 0.25)',
                  marginBottom: '16px',
                }}
              >
                <HardDrive size={18} /> Pilih Folder di Laptop & Salin Otomatis
              </button>
            )}

            {/* Active Copy Progress */}
            {isProcessing && progress && (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                    {progress.statusText}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#007AFF' }}>
                    {progress.current}/{progress.total}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--border)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                      height: '100%',
                      backgroundColor: '#007AFF',
                      transition: 'width 0.15s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#FFF0F0',
                  color: 'var(--heart)',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={18} /> {errorMsg}
              </div>
            )}

            {/* Results Report */}
            {result && (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--status-green-bg)',
                  border: '1px solid #C3E6CB',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <CheckCircle2 size={24} color="var(--status-green-text)" />
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--status-green-text)' }}>
                    {result.copiedCount} file berhasil disalin!
                  </h4>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  File tersimpan di subfolder baru di dalam folder yang kamu pilih.
                </p>

                {result.missing.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #FFE0B2',
                    }}
                  >
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#B25E00', marginBottom: '4px' }}>
                      ⚠️ {result.missing.length} file tidak ditemukan di folder:
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {result.missing.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} className="pill-btn pill-btn-secondary" style={{ width: '100%' }}>
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
