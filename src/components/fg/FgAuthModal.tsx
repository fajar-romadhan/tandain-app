import React, { useState } from 'react';
import { Modal } from '../Modal';
import { isGoogleProviderEnabled, signInWithGoogle } from '../../services/supabase';
import { ShieldCheck, Laptop, Smartphone, AlertCircle } from 'lucide-react';

interface FgAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Single login path for photographers: Google account.
 * Every Google account = one studio with its own projects, so vendors never get mixed up.
 */
export const FgAuthModal: React.FC<FgAuthModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Pre-check so the user never lands on Supabase's raw JSON error page
      const enabled = await isGoogleProviderEnabled();
      if (!enabled) {
        setErrorMsg('Google OAuth belum diaktifkan di Supabase. Aktifkan di Supabase Dashboard → Authentication → Providers → Google (masukkan Google Client ID & Secret).');
        setIsLoading(false);
        return;
      }
      await signInWithGoogle(); // browser redirects to Google
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal terhubung ke Google. Coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Masuk ke Tandain" maxWidth="440px">
      <div style={{ padding: '4px 0 12px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>📸</div>
        <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
          Masuk sebagai Fotografer
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
          Satu akun Google = satu studio. Semua galeri klien kamu tersimpan aman dan terpisah dari vendor lain.
        </p>

        <div
          style={{
            textAlign: 'left',
            backgroundColor: '#F5F5F7',
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '9px',
            fontSize: '12.5px',
            color: 'var(--text)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={15} color="#007AFF" />
            <span>Data studio kamu hanya bisa diakses akun kamu sendiri</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Laptop size={15} color="var(--primary)" />
            <span>Buka dashboard dari laptop atau HP mana pun, datanya sama</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={15} color="#34C759" />
            <span>Klien tetap memilih foto tanpa perlu login</span>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
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
            {errorMsg.includes('Supabase') && (
              <a
                href="https://supabase.com/dashboard/project/iwkxcppbhxdkiuborexk/auth/providers"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#9E4E00',
                  textDecoration: 'underline',
                  display: 'inline-block',
                }}
              >
                ⚙️ Buka Supabase Auth Providers di Tab Baru →
              </a>
            )}
          </div>
        )}

        <button
          id="btn-login-google"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '12px',
            border: '1.5px solid var(--border)',
            backgroundColor: '#FFFFFF',
            color: 'var(--text)',
            fontSize: '14.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
          <span>{isLoading ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Google'}</span>
        </button>

        <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary, #8E8E93)', marginTop: '14px', lineHeight: 1.5 }}>
          Kami hanya membaca nama & email akun Google kamu untuk membuat studio.
        </p>
      </div>
    </Modal>
  );
};
