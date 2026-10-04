import React, { useState } from 'react';
import { Modal } from '../Modal';
import { signInWithGoogle } from '../../services/supabase';
import { ShieldCheck, Laptop, Smartphone, AlertCircle, ArrowRight } from 'lucide-react';
import type { StudioProfile } from '../../types';

interface FgAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  onOpenSettings?: () => void;
  studio?: StudioProfile;
}

export const FgAuthModal: React.FC<FgAuthModalProps> = ({
  isOpen,
  onClose,
  onContinueAsGuest,
  onOpenSettings,
  studio,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      // If Supabase is not configured yet
      setErrorMsg(
        err.message || 'Supabase belum terhubung. Kamu tetap bisa lanjut sebagai tamu di mode lokal!'
      );
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Masuk ke Tandain" maxWidth="460px">
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 45, 85, 0.08)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '28px',
            margin: '0 auto 16px',
          }}
        >
          📸
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
          {studio?.studioName ? `Dashboard ${studio.studioName}` : 'Dashboard Fotografer'}
        </h3>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
          Masuk dengan akun Google untuk menyimpan galeri di cloud, sinkronisasi real-time, dan akses dari perangkat mana pun.
        </p>

        {/* Benefits list */}
        <div
          style={{
            textAlign: 'left',
            backgroundColor: '#F5F5F7',
            padding: '16px',
            borderRadius: '14px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '13px',
            color: 'var(--text)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Laptop size={16} color="var(--primary)" />
            <span>Sinkron otomatis antara laptop dan HP fotografer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={16} color="#34C759" />
            <span>Klien tetap bebas memilih foto tanpa perlu login</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#007AFF" />
            <span>Data aman & tersinkronisasi otomatis</span>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: '#FFF4E5',
              border: '1px solid #FFE0B2',
              color: '#B25E00',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{errorMsg}</span>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                style={{
                  alignSelf: 'flex-start',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#9E4E00',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ⚙️ Buka Pengaturan Studio untuk Mengisi Key →
              </button>
            )}
          </div>
        )}

        {/* Google 1-Click Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '14px',
            border: '1.5px solid var(--border)',
            backgroundColor: '#FFFFFF',
            color: 'var(--text)',
            fontSize: '14.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.15s ease',
            marginBottom: '12px',
          }}
        >
          {/* Google 4-color SVG */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{isLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Akun Google'}</span>
        </button>

        {/* Guest fallback button */}
        <button
          onClick={() => {
            onContinueAsGuest();
            onClose();
          }}
          className="pill-btn pill-btn-ghost"
          style={{ width: '100%', height: '42px', fontSize: '13px', color: 'var(--text-secondary)' }}
        >
          Lanjut sebagai Tamu (Mode Lokal) <ArrowRight size={14} />
        </button>
      </div>
    </Modal>
  );
};
