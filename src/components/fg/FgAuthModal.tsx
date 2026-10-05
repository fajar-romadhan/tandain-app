import React, { useState } from 'react';
import { Modal } from '../Modal';
import {
  isGoogleProviderEnabled,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  startDirectStudioSession,
  DEMO_TESTING_ACCOUNT,
  loginTestingAccount,
} from '../../services/supabase';
import type { AuthUser } from '../../types';
import {
  Camera,
  Mail,
  Lock,
  MessageCircle,
  ShieldCheck,
  Laptop,
  Smartphone,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Zap,
} from 'lucide-react';

interface FgAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AuthUser) => void;
}

/**
 * 2 Jalur Masuk ke Tandain:
 * Jalur 1: Daftar / Masuk Mandiri via Form Web (Email & Password Studio)
 * Jalur 2: 1-Klik Masuk via Akun Google OAuth
 *
 * Keduanya memberikan akses 100% penuh ke seluruh fitur Tandain.
 */
export const FgAuthModal: React.FC<FgAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Status & loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmationNotice, setConfirmationNotice] = useState<{
    show: boolean;
    email: string;
    studioName: string;
    tempUser: AuthUser | null;
  } | null>(null);

  // 🔒 Mode Testing Khusus Owner / Developer (TIDAK DITAMPILKAN KE PUBLIK)
  // Hanya aktif jika URL memiliki parameter ?demo=1 / ?test=1, atau disimpan di localStorage
  const [showDevTestBox, setShowDevTestBox] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === '0' || params.get('test') === '0') {
        localStorage.removeItem('tandain_show_demo');
        return false;
      }
      if (params.get('demo') === '1' || params.get('test') === '1' || params.get('dev') === '1') {
        localStorage.setItem('tandain_show_demo', 'true');
        return true;
      }
      return localStorage.getItem('tandain_show_demo') === 'true';
    } catch {
      return false;
    }
  });

  // Rahasia tap 3x untuk mengaktifkan / menonaktifkan mode testing bagi owner
  const secretClickRef = React.useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null });
  const handleSecretToggle = () => {
    if (secretClickRef.current.timer) clearTimeout(secretClickRef.current.timer);
    secretClickRef.current.count += 1;
    if (secretClickRef.current.count >= 3) {
      secretClickRef.current.count = 0;
      setShowDevTestBox((current) => {
        const next = !current;
        try {
          if (next) {
            localStorage.setItem('tandain_show_demo', 'true');
          } else {
            localStorage.removeItem('tandain_show_demo');
          }
        } catch {}
        return next;
      });
      return;
    }
    secretClickRef.current.timer = setTimeout(() => {
      secretClickRef.current.count = 0;
    }, 1200);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setStudioName('');
    setWhatsapp('');
    setErrorMsg('');
    setConfirmationNotice(null);
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  // Jalur 1: Submit Form Web (Login / Register)
  const handleSubmitWebAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setConfirmationNotice(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Mohon isi email dan password.');
      return;
    }

    if (activeTab === 'register' && !studioName.trim()) {
      setErrorMsg('Mohon isi nama studio / vendor fotografer Anda.');
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        // Masuk Akun Web
        const user = await signInWithEmail(email, password);
        setIsLoading(false);
        if (onSuccess) onSuccess(user);
        handleModalClose();
      } else {
        // Daftar Studio Baru di Web
        const result = await signUpWithEmail(email, password, studioName, whatsapp);
        setIsLoading(false);

        if (!result.requiresEmailConfirmation && result.user) {
          // Berhasil langsung aktif tanpa tunggu konfirmasi email
          if (onSuccess) onSuccess(result.user);
          handleModalClose();
        } else {
          // Supabase mengirimkan email konfirmasi
          setConfirmationNotice({
            show: true,
            email: email.trim(),
            studioName: studioName.trim(),
            tempUser: result.user,
          });
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Gagal memproses permintaan. Periksa koneksi internet Anda.');
    }
  };

  // Masuk Langsung jika konfirmasi email tertunda (Biar FG tidak terhambat)
  const handleDirectStudioEntry = () => {
    if (!confirmationNotice) return;
    const directUser = startDirectStudioSession(
      confirmationNotice.studioName,
      confirmationNotice.email,
      whatsapp
    );
    if (onSuccess) onSuccess(directUser);
    handleModalClose();
  };

  // Jalur 2: Masuk Cepat dengan Akun Google
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const enabled = await isGoogleProviderEnabled();
      if (!enabled) {
        setErrorMsg(
          'Google OAuth belum diaktifkan di Supabase. Anda dapat langsung mendaftar lewat Jalur 1 (Form Web di atas) tanpa hambatan.'
        );
        setIsGoogleLoading(false);
        return;
      }
      await signInWithGoogle();
    } catch (err: any) {
      setIsGoogleLoading(false);
      setErrorMsg(err?.message || 'Gagal terhubung ke Google. Coba lagi atau gunakan formulir web.');
    }
  };

  // ⚡ Masuk Langsung Akun Testing (1-Klik 0-Detik)
  const handleQuickTestLogin = () => {
    setErrorMsg('');
    const testUser = loginTestingAccount();
    if (onSuccess) onSuccess(testUser);
    handleModalClose();
  };

  // ⚡ Isi Otomatis Kredensial Testing ke Form
  const handleAutoFillTestCredentials = () => {
    setActiveTab('login');
    setEmail(DEMO_TESTING_ACCOUNT.email);
    setPassword(DEMO_TESTING_ACCOUNT.password);
    setErrorMsg('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Akses Dashboard Fotografer"
      maxWidth="460px"
    >
      <div style={{ padding: '4px 0 10px' }}>
        {/* ==========================================================
            AKUN TESTING SIAP PAKAI (KHUSUS OWNER / DEV - TIDAK DITAMPILKAN KE PUBLIK)
            Akses privat: buka link dengan ?demo=1 atau tap 3x icon perisai di bawah
            ========================================================== */}
        {showDevTestBox && (
          <>
            <div
              style={{
                background: 'linear-gradient(135deg, #F0F6FF 0%, #E8F1FE 100%)',
                border: '1.5px solid #BFDBFE',
                borderRadius: '16px',
                padding: '14px 16px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚡</span>
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E40AF', display: 'block' }}>
                      Akun Testing Siap Pakai (Mode Internal)
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#3B82F6', fontWeight: 500 }}>
                      Hanya tampil untuk Anda (Privat)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDevTestBox(false);
                    try {
                      localStorage.removeItem('tandain_show_demo');
                    } catch {}
                  }}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#DBEAFE',
                    color: '#1D4ED8',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title="Sembunyikan panel testing"
                >
                  Tutup ✕
                </button>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  marginBottom: '10px',
                  border: '1px solid #DBEAFE',
                  fontSize: '12px',
                  color: '#374151',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Studio: <b>{DEMO_TESTING_ACCOUNT.studioName}</b></span>
                  <span style={{ color: '#2563EB', fontWeight: 600 }}>Siap Pakai</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#6B7280' }}>
                  <span>Email: <code style={{ color: '#1F2937' }}>{DEMO_TESTING_ACCOUNT.email}</code></span>
                  <span>Pass: <code style={{ color: '#1F2937' }}>{DEMO_TESTING_ACCOUNT.password}</code></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  id="btn-quick-testing-login"
                  type="button"
                  onClick={handleQuickTestLogin}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    borderRadius: '10px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Zap size={16} /> Masuk Akun Testing (1-Klik)
                </button>
                <button
                  type="button"
                  onClick={handleAutoFillTestCredentials}
                  title="Isi otomatis ke formulir login di bawah"
                  style={{
                    minHeight: '44px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    color: '#1D4ED8',
                    border: '1px solid #BFDBFE',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Isi Form
                </button>
              </div>
            </div>

            {/* Subtitle saat mode testing aktif */}
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              Atau masuk dengan akun Anda sendiri via formulir web atau akun Google:
            </p>
          </>
        )}

        {/* ==========================================================
            JALUR 1: AKUN WEB TANDAIN (DAFTAR & MASUK LANGSUNG)
            ========================================================== */}
        <div
          style={{
            borderRadius: '16px',
            border: '1px solid var(--border)',
            backgroundColor: '#FFFFFF',
            padding: '16px',
            marginBottom: '18px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Segmented Tab: Masuk vs Daftar Baru */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg)',
              padding: '3px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              marginBottom: '16px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setConfirmationNotice(null);
              }}
              style={{
                flex: 1,
                height: '38px',
                borderRadius: '9999px',
                fontSize: '13.5px',
                fontWeight: activeTab === 'login' ? 700 : 500,
                backgroundColor: activeTab === 'login' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'login' ? 'var(--text)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
                setConfirmationNotice(null);
              }}
              style={{
                flex: 1,
                height: '38px',
                borderRadius: '9999px',
                fontSize: '13.5px',
                fontWeight: activeTab === 'register' ? 700 : 500,
                backgroundColor: activeTab === 'register' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'register' ? 'var(--text)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              Daftar Studio Baru ✨
            </button>
          </div>

          {/* Banner Notifikasi Konfirmasi Email jika diperlukan */}
          {confirmationNotice?.show ? (
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#E8F5E9',
                border: '1px solid #C8E6C9',
                marginBottom: '12px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#2E7D32' }}>
                <CheckCircle2 size={18} />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Akun Studio Berhasil Dibuat!</span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#1B5E20', lineHeight: 1.5, marginBottom: '12px' }}>
                Tautan konfirmasi telah dikirim ke <b>{confirmationNotice.email}</b>. Anda juga bisa langsung masuk sekarang untuk mulai menggunakan seluruh fitur:
              </p>
              <button
                type="button"
                onClick={handleDirectStudioEntry}
                className="pill-btn pill-btn-primary"
                style={{ width: '100%', height: '42px', fontSize: '13.5px', gap: '6px', backgroundColor: '#2E7D32' }}
              >
                <UserCheck size={16} /> Buka Dashboard Studio Sekarang <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            /* Form Input Jalur Web */
            <form onSubmit={handleSubmitWebAuth}>
              {/* Field Khusus Pendaftaran: Nama Studio */}
              {activeTab === 'register' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '5px' }}>
                    Nama Studio / Vendor Fotografer*
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Camera
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="text"
                      required
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="Misal: Arka Visual / Lens Story"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 12px 0 38px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        outline: 'none',
                        fontSize: '16px',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Field Khusus Pendaftaran: WhatsApp Studio */}
              {activeTab === 'register' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '5px' }}>
                    Nomor WhatsApp Studio (Untuk Notifikasi Pilihan Klien)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MessageCircle
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#25D366',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Misal: 081234567890"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 12px 0 38px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        outline: 'none',
                        fontSize: '16px',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600 }}>
                    Email Studio*
                  </label>
                  {activeTab === 'login' && showDevTestBox && (
                    <button
                      type="button"
                      onClick={handleAutoFillTestCredentials}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '11.5px',
                        color: '#007AFF',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Zap size={12} /> Isi Akun Testing
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-tertiary)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@studiokamu.com"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 12px 0 38px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      outline: 'none',
                      fontSize: '16px',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '5px' }}>
                  Password (minimal 6 karakter)*
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-tertiary)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 12px 0 38px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      outline: 'none',
                      fontSize: '16px',
                    }}
                  />
                </div>
              </div>

              {/* Tombol Submit Form Web */}
              <button
                type="submit"
                disabled={isLoading}
                className="pill-btn pill-btn-primary"
                style={{ width: '100%', height: '46px', fontSize: '15px', fontWeight: 700, gap: '8px' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Memproses...
                  </>
                ) : activeTab === 'login' ? (
                  'Masuk ke Dashboard Studio'
                ) : (
                  'Daftar Akun Studio & Mulai 🚀'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#FFF0F3',
              border: '1px solid #FFD1DC',
              color: 'var(--heart)',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'left',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ==========================================================
            DIVIDER: ATAU JALUR 2 GOOGLE
            ========================================================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '0 0 16px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Atau Jalur 2: 1-Klik Google
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        </div>

        {/* ==========================================================
            JALUR 2: AKUN GOOGLE OAUTH
            ========================================================== */}
        <button
          id="btn-login-google"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
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
            cursor: isGoogleLoading ? 'wait' : 'pointer',
            opacity: isGoogleLoading ? 0.7 : 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.15s ease',
            marginBottom: '16px',
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
          <span>{isGoogleLoading ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Akun Google'}</span>
        </button>

        {/* Keamanan & Privasi Info */}
        <div
          style={{
            textAlign: 'left',
            backgroundColor: '#F5F5F7',
            padding: '12px 14px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            userSelect: 'none',
          }}
        >
          <div
            onClick={handleSecretToggle}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default' }}
            title=""
          >
            <ShieldCheck size={14} color="#007AFF" />
            <span>2 Jalur Aman: Data galeri & foto RAW Anda terisolasi aman</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Laptop size={14} color="var(--primary)" />
            <span>Semua fitur (Drive Matcher, RAW Copy, Unduh HD) terbuka 100%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={14} color="#34C759" />
            <span>Klien tetap bisa memilih foto tanpa perlu login atau daftar</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
