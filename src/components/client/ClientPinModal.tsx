import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import type { Project, StudioProfile } from '../../types';

interface ClientPinModalProps {
  project: Project;
  studio: StudioProfile;
  onSuccess: () => void;
}

export const ClientPinModal: React.FC<ClientPinModalProps> = ({ project, studio, onSuccess }) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (failedAttempts >= 5) {
      setError('Terlalu banyak percobaan salah. Coba lagi dalam beberapa menit ya atau tanya ke FG.');
      return;
    }

    if (pinInput.trim() === project.pin) {
      onSuccess();
    } else {
      setFailedAttempts((prev) => prev + 1);
      setError('PIN-nya salah nih, coba dicek lagi ya!');
      setPinInput('');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg)',
      }}
    >
      <div
        className="card-ios"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '36px 28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--text)',
          }}
        >
          <Lock size={28} />
        </div>

        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          {studio.studioName}
        </p>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
          {project.clientName}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>
          Galeri ini dikunci dengan PIN oleh fotografermu.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              maxLength={8}
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setError('');
              }}
              placeholder="Masukkan PIN"
              style={{
                width: '100%',
                height: '52px',
                textAlign: 'center',
                fontSize: '22px',
                letterSpacing: '4px',
                fontWeight: 700,
                borderRadius: '16px',
                border: error ? '2px solid var(--heart)' : '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: 'var(--heart)', fontWeight: 500, marginBottom: '16px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="pill-btn pill-btn-primary"
            style={{ width: '100%', height: '48px', fontSize: '16px', justifyContent: 'center' }}
          >
            Buka Galeri <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
          <a
            href={`https://wa.me/${(project.studioWhatsapp || studio.whatsapp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo ${project.studioName || studio.studioName}, saya client ${project.clientName}. Mau tanya PIN untuk buka galeri Tandain ya.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}
          >
            Lupa atau belum dapat PIN? Chat Fotografer
          </a>
        </div>
      </div>
    </div>
  );
};
