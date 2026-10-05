import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Trash2, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '../Modal';
import type { Photo, Project, StudioProfile } from '../../types';

interface ClientReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  photos: Photo[];
  selectedFileNames: string[];
  studio: StudioProfile;
  onRemovePhoto: (filename: string) => void;
  onSubmitFinal: () => void;
}

export const ClientReviewModal: React.FC<ClientReviewModalProps> = ({
  isOpen,
  onClose,
  project,
  photos,
  selectedFileNames,
  studio,
  onRemovePhoto,
  onSubmitFinal,
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const selectedPhotos = photos.filter((p) => selectedFileNames.includes(p.name));

  const handleConfirmSubmit = () => {
    onSubmitFinal();
    setIsSubmitted(true);
    // Trigger confetti celebration!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF2D55', '#34C759', '#007AFF', '#FF9500'],
      });
    } catch {}
  };

  const targetWhatsapp = (project.studioWhatsapp || studio.whatsapp || '').replace(/[^0-9]/g, '');
  const targetStudioName = project.studioName || studio.studioName || 'Fotografer';
  const studioAccent = project.accentColor || studio.accentColor || '#1D1D1F';

  const generateWaMessage = () => {
    const defaultMsg = `Halo ${targetStudioName}! Saya ${project.clientName} sudah selesai memilih ${selectedFileNames.length} foto di Tandain.

Berikut daftar foto yang saya pilih:
${selectedFileNames.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Mohon segera diproses ya kak. Terima kasih! ✨`;
    return encodeURIComponent(defaultMsg);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitted) onClose();
      }}
      title={isSubmitted ? 'Pilihan Terkirim! 🎉' : 'Periksa Pilihanmu'}
      maxWidth="600px"
    >
      {!isSubmitted ? (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status Kuota</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                {selectedFileNames.length} dari {project.quota} foto dipilih
              </p>
            </div>
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor:
                  selectedFileNames.length === project.quota
                    ? 'var(--status-green-bg)'
                    : 'var(--status-amber-bg)',
                color:
                  selectedFileNames.length === project.quota
                    ? 'var(--status-green-text)'
                    : 'var(--status-amber-text)',
              }}
            >
              {selectedFileNames.length === project.quota
                ? 'Pas sesuai paket ✓'
                : `Masih sisa ${project.quota - selectedFileNames.length} foto`}
            </span>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Setelah dikirim, pilihan akan dikunci agar fotografer bisa langsung menyiapkan file RAW untuk diedit.
          </p>

          {/* Selected Photos List */}
          <div
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '8px',
              marginBottom: '20px',
            }}
          >
            {selectedPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: idx % 2 === 0 ? 'var(--surface-subtle)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={photo.url}
                    alt={photo.name}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }}
                  />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                      {photo.name}
                    </p>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      Pilihan #{idx + 1}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onRemovePhoto(photo.name)}
                  style={{
                    color: 'var(--text-tertiary)',
                    padding: '8px',
                    borderRadius: '8px',
                    transition: 'color 0.15s ease',
                  }}
                  title="Hapus dari pilihan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              className="pill-btn pill-btn-secondary"
              style={{ flex: 1 }}
            >
              <ArrowLeft size={16} /> Cek Lagi
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="pill-btn"
              style={{
                flex: 1.5,
                fontSize: '15px',
                height: '46px',
                backgroundColor: studioAccent,
                color: '#FFFFFF',
                boxShadow: `0 6px 20px ${studioAccent}55`,
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
            >
              Gas Kirim Pilihan 🚀
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-green-bg)',
              color: 'var(--status-green-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircle2 size={40} />
          </div>

          <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            Pilihanmu Udah Terkirim! 🎉
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            {selectedFileNames.length} foto pilihan kamu sudah tercatat di sistem Tandain.
            Yuk langsung konfirmasi ke WhatsApp fotografer biar langsung digarap!
          </p>

          <a
            href={`https://wa.me/${targetWhatsapp}?text=${generateWaMessage()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pill-btn"
            style={{
              width: '100%',
              height: '52px',
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)',
              marginBottom: '16px',
            }}
          >
            <MessageCircle size={20} /> Konfirmasi ke WhatsApp Fotografer
          </a>

          <button
            onClick={onClose}
            className="pill-btn pill-btn-ghost"
            style={{ width: '100%' }}
          >
            Lihat Kembali Galeri (Terkunci)
          </button>
        </div>
      )}
    </Modal>
  );
};
