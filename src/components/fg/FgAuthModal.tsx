import React, { useState } from 'react';
import { Modal } from '../Modal';
import { signInWithGoogle } from '../../services/supabase';
import { ShieldCheck, Laptop, Smartphone, AlertCircle, ArrowRight, Camera, Sparkles } from 'lucide-react';
import type { StudioProfile } from '../../types';

interface FgAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  onOpenSettings?: () => void;
  onStudioLogin?: (studioName: string, whatsapp: string) => void;
  studio?: StudioProfile;
}

export const FgAuthModal: React.FC<FgAuthModalProps> = ({
  isOpen,
  onClose,
  onContinueAsGuest,
  onOpenSettings,
  onStudioLogin,
  studio,
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'google'>('studio');
  const [studioInput, setStudioInput] = useState(studio?.studioName || '');
  const [whatsappInput, setWhatsappInput] = useState(studio?.whatsapp || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStudioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioInput.trim()) {
      setErrorMsg('Masukkan nama studio kamu terlebih dahulu.');
      return;
    }
    if (onStudioLogin) {
      onStudioLogin(studioInput.trim(), whatsappInput.trim());
    } else {
      onContinueAsGuest();
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('provider') || err.message?.toLowerCase().includes('not enabled')) {
        setErrorMsg(
          'Google Provider belum diaktifkan di Supabase. Gunakan tab "Masuk Studio" di sebelah kiri untuk langsung masuk seketika tanpa hambatan!'
        );
      } else {
        setErrorMsg(
          err.message || 'Supabase belum terhubung. Kamu tetap bisa lanjut sebagai tamu di mode lokal!'
        );
      }
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Masuk ke Tandain" maxWidth="480px">
      <div style={{ padding: '4px 0 16px' }}>
        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F5F5F7',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('studio');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              height: '36px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'studio' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'studio' ? 'var(--text)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'studio' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Camera size={15} /> Masuk Studio
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              height: '36px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'google' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'google' ? 'var(--text)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'google' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={15} /> Akun Google
          </button>
        </div>

        {/* Tab 1: Instant Studio Login (100% Guaranteed Success, Zero API barrier) */}
        {activeTab === 'studio' && (
          <form onSubmit={handleStudioSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                Buka Dashboard Studio
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Akses instan tanpa password. Nama studio kamu akan tampil otomatis di galeri klien.
              </p>
            </div>

            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Nama Studio / Brand Fotografer*
              </label>
              <input
                type="text"
                required
                value={studioInput}
                onChange={(e) => setStudioInput(e.target.value)}
                placeholder="Contoh: Fajar Visual Photography"
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border)',
                  padding: '0 14px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'var(--bg)',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Nomor WhatsApp Konfirmasi (Opsional)
              </label>
              <input
                type="tel"
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                placeholder="Contoh: 081234567890"
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border)',
                  padding: '0 14px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'var(--bg)',
                }}
              />
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#FFF4E5',
                  color: '#B25E00',
                  fontSize: '12.5px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="pill-btn pill-btn-primary"
              style={{
                width: '100%',
                height: '46px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '12px',
                marginBottom: '12px',
              }}
            >
              Masuk ke Dashboard Studio <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Tab 2: Google OAuth */}
        {activeTab === 'google' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Masuk dengan Akun Google
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Masuk dengan 1-klik akun Google untuk sinkronisasi cloud real-time antar perangkat.
            </p>

            {/* Benefits */}
            <div
              style={{
                textAlign: 'left',
                backgroundColor: '#F5F5F7',
                padding: '14px',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12.5px',
                color: 'var(--text)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Laptop size={15} color="var(--primary)" />
                <span>Sinkron otomatis antara laptop dan HP fotografer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={15} color="#34C759" />
                <span>Klien tetap bebas memilih foto tanpa perlu login</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={15} color="#007AFF" />
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

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                border: '1.5px solid var(--border)',
                backgroundColor: '#FFFFFF',
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease',
                marginBottom: '14px',
              }}
            >
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
          </div>
        )}

        {/* Guest fallback button */}
        <button
          onClick={() => {
            onContinueAsGuest();
            onClose();
          }}
          className="pill-btn pill-btn-ghost"
          style={{ width: '100%', height: '38px', fontSize: '13px', color: 'var(--text-secondary)' }}
        >
          Lanjut Cepat sebagai Tamu (Mode Lokal) <ArrowRight size={13} />
        </button>
      </div>
    </Modal>
  );
};
