import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Modal } from '../Modal';
import { formatForLightroom } from '../../services/lightroom';

interface FgLightroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFileNames: string[];
}

export const FgLightroomModal: React.FC<FgLightroomModalProps> = ({
  isOpen,
  onClose,
  selectedFileNames,
}) => {
  const [copied, setCopied] = useState(false);
  const formattedText = formatForLightroom(selectedFileNames);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Panduan Filter Lightroom Classic" maxWidth="540px">
      <div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
          Jika kamu sudah mengimport seluruh file RAW ke katalog Lightroom, kamu bisa langsung memfilter {selectedFileNames.length} foto pilihan klien ini dengan 3 langkah mudah:
        </p>

        {/* 3 Steps Guide */}
        <div
          style={{
            backgroundColor: 'var(--surface-subtle)',
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              1
            </span>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
              Buka katalog Lightroom kamu di modul <b>Library</b> (tekan tombol <b>G</b>).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              2
            </span>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
              Tampilkan bar filter di atas dengan menekan tombol <b>\</b> (backslash) pada keyboard.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              3
            </span>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
              Pilih tab <b>Text</b> &rarr; atur kolom menjadi <b>Filename</b> &rarr; <b>Contains</b> &rarr; <b>Paste</b> teks di bawah ini!
            </p>
          </div>
        </div>

        {/* Text Box & Copy Button */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
            Format Nama File Siap Paste:
          </label>
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              maxHeight: '100px',
              overflowY: 'auto',
              fontSize: '13px',
              fontFamily: 'monospace',
              color: 'var(--text)',
              marginBottom: '10px',
              wordBreak: 'break-all',
            }}
          >
            {formattedText}
          </div>

          <button
            onClick={handleCopy}
            className={`pill-btn ${copied ? 'pill-btn-heart' : 'pill-btn-primary'}`}
            style={{ width: '100%', height: '46px' }}
          >
            {copied ? (
              <>
                <Check size={18} /> Berhasil Tersalin ke Clipboard!
              </>
            ) : (
              <>
                <Copy size={18} /> Salin Format Lightroom ({selectedFileNames.length} foto)
              </>
            )}
          </button>
        </div>

        <button onClick={onClose} className="pill-btn pill-btn-secondary" style={{ width: '100%' }}>
          Tutup
        </button>
      </div>
    </Modal>
  );
};
