import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Laptop,
  HardDrive,
  Unlock,
  ShieldCheck,
  FileText,
  Sparkles,
} from 'lucide-react';

interface FgGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewProject?: () => void;
}

export const FgGuideModal: React.FC<FgGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenNewProject,
}) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'dashboard' | 'raw_guide'>('workflow');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out forwards',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--text)',
                  margin: 0,
                  letterSpacing: '-0.3px',
                }}
              >
                Panduan & Tutorial Alur Kerja Fotografer
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  margin: '3px 0 0 0',
                }}
              >
                Kuasai alur kerja Tandain dari pembuatan proyek, seleksi klien di HP, hingga auto-copy file RAW di laptop
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="pill-btn pill-btn-ghost"
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
            title="Tutup panduan"
            aria-label="Tutup panduan"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modern Segmented Navigation Tabs */}
        <div
          style={{
            padding: '12px 24px 10px',
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              backgroundColor: 'var(--surface-sunken)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setActiveTab('workflow')}
              type="button"
              style={{
                height: '36px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                fontWeight: activeTab === 'workflow' ? 700 : 500,
                backgroundColor: activeTab === 'workflow' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'workflow' ? 'var(--text)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'workflow' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={14} style={{ color: activeTab === 'workflow' ? 'var(--accent)' : 'inherit' }} />
              <span>1. Alur Kerja</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              type="button"
              style={{
                height: '36px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                fontWeight: activeTab === 'dashboard' ? 700 : 500,
                backgroundColor: activeTab === 'dashboard' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'dashboard' ? 'var(--text)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'dashboard' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <ShieldCheck size={14} style={{ color: activeTab === 'dashboard' ? 'var(--accent)' : 'inherit' }} />
              <span>2. Fitur Tombol</span>
            </button>

            <button
              onClick={() => setActiveTab('raw_guide')}
              type="button"
              style={{
                height: '36px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                fontWeight: activeTab === 'raw_guide' ? 700 : 500,
                backgroundColor: activeTab === 'raw_guide' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'raw_guide' ? 'var(--text)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'raw_guide' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Laptop size={14} style={{ color: activeTab === 'raw_guide' ? 'var(--accent)' : 'inherit' }} />
              <span>3. Ambil RAW</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* TAB 1: WORKFLOW TUTORIAL (A - Z) */}
          {activeTab === 'workflow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                    Alur Singkat 5 Menit:
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', fontWeight: 600 }}>1. Siapkan Drive</span>
                  <span style={{ opacity: 0.35 }}>➔</span>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', fontWeight: 600 }}>2. Buat Proyek</span>
                  <span style={{ opacity: 0.35 }}>➔</span>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', fontWeight: 600 }}>3. Kirim WA ke Klien</span>
                  <span style={{ opacity: 0.35 }}>➔</span>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', fontWeight: 600 }}>4. Klien Pilih di HP</span>
                  <span style={{ opacity: 0.35 }}>➔</span>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(0, 122, 255, 0.08)', color: 'var(--accent)', border: '1px solid rgba(0, 122, 255, 0.2)', fontWeight: 700 }}>5. Auto Ambil RAW ⚡</span>
                </div>
              </div>

              {/* STEP 1 */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    Upload Preview Foto ke Google Drive & Buat Proyek
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    Export foto preview dalam format JPG (ukuran ~1-2 MB cukup agar cepat di HP klien). Upload ke Google Drive dan pastikan setelan akses folder disetel: <strong>"Siapa saja yang memiliki link bisa melihat"</strong>.
                  </p>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', backgroundColor: 'var(--surface)', padding: '10px 14px', borderRadius: '10px' }}>
                    💡 <em>Klik tombol <strong>+ Project Baru</strong> di dashboard, tempel link folder Drive, isi nama klien dan kuota foto yang boleh dipilih.</em>
                  </div>
                </div>
              </div>

              {/* STEP 2 */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#34C759',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    Kirim Link Galeri ke Klien via WhatsApp
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    Klik tombol hijau <strong>Buka WA</strong> atau <strong>Salin Link</strong>. Sistem sudah menyiapkan template pesan WhatsApp yang sopan, ramah, dan memuat link unik klien.
                  </p>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', backgroundColor: 'var(--surface)', padding: '10px 14px', borderRadius: '10px' }}>
                    ✨ <strong>Klien Tidak Perlu Bikin Akun:</strong> Klien langsung klik link dari WA di HP (iPhone/Android) tanpa perlu login dan tanpa perlu install aplikasi apa pun.
                  </div>
                </div>
              </div>

              {/* STEP 3 */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--heart)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    Klien Memilih Foto (Grid / Mode Swipe ala Tinder)
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    Klien menandai foto favorit dengan tap hati ❤️ di galeri grid, atau masuk ke <strong>Mode Swipe</strong> (geser kanan untuk pilih, geser kiri untuk lewati).
                  </p>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', backgroundColor: 'var(--surface)', padding: '10px 14px', borderRadius: '10px' }}>
                    📱 Indikator kuota melayang di layar HP klien menghitung secara otomatis berapa foto yang sudah dipilih dan sisa kuota yang harus dipenuhi.
                  </div>
                </div>
              </div>

              {/* STEP 4 */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#FF9500',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  4
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)' }}>
                    Klien Kirim Konfirmasi Pilihan (Otomatis Terkunci)
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    Begitu kuota pas (contoh: 50/50), klien menekan tombol <strong>Kirim Pilihan ke Fotografer</strong>. Pesan konfirmasi otomatis terkirim ke WhatsApp studio Anda.
                  </p>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', backgroundColor: 'var(--surface)', padding: '10px 14px', borderRadius: '10px' }}>
                    🔒 Galeri klien otomatis terkunci agar pilihan tidak berubah-ubah saat Anda mulai mengedit, dan status dashboard Anda otomatis berganti menjadi <strong>Udah kirim 🎉</strong> secara realtime!
                  </div>
                </div>
              </div>

              {/* STEP 5 */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(0, 122, 255, 0.08)',
                  border: '1.5px solid var(--accent)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  5
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--accent)' }}>
                    Auto-Match & Ambil RAW dari Laptop dalam 5 Detik! 🚀
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    Buka proyek di laptop via <strong>Google Chrome / Edge</strong> ➔ klik tombol biru <strong>"Ambil RAW dari Laptop"</strong> ➔ pilih folder master kartu SD/harddisk lokal Anda.
                  </p>
                  <div style={{ fontSize: '12.5px', color: 'var(--text)', backgroundColor: 'var(--surface)', padding: '10px 14px', borderRadius: '10px', fontWeight: 500 }}>
                    📂 Tandain langsung mencocokkan nama file pilihan klien dan <strong>otomatis menyalin seluruh file RAW kamera (.CR3, .ARW, .NEF, .DNG) ke folder baru di laptop Anda</strong> dalam hitungan detik. Tanpa internet, tanpa cari manual satu per satu!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DASHBOARD FUNCTIONS */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* STATUS BADGES */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--accent)" /> Status Proyek Real-Time
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-secondary)' }}>⚪ Belum dibuka</div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                      Link galeri baru dibuat, klien belum mengklik atau membuka tautan.
                    </p>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#007AFF' }}>🔵 Lagi milih</div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                      Klien sedang aktif membuka galeri dan menandai foto di HP-nya.
                    </p>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#D97706' }}>🎉 Udah kirim</div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                      Klien sudah selesai memilih & mengirim konfirmasi. Siap ambil RAW!
                    </p>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#34C759' }}>🟢 Selesai ✓</div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                      Proses seleksi dan editing selesai, foto sudah diserahkan ke klien.
                    </p>
                  </div>
                </div>
              </div>

              {/* BUKA KUNCI (BERI REVISI) */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Unlock size={17} color="#D97706" /> Buka Kunci (Beri Revisi) vs Kunci Pilihan
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                  Secara default, begitu klien mengirimkan pilihannya, galeri mereka otomatis terkunci agar pilihan tidak diubah-ubah secara sepihak saat Anda sedang mengedit.
                </p>
                <div style={{ fontSize: '12.5px', color: 'var(--text)', backgroundColor: 'var(--surface)', padding: '10px 14px', borderRadius: '10px', borderLeft: '3px solid #D97706' }}>
                  👉 <strong>Jika Klien Minta Ganti/Tukar Foto:</strong> Anda cukup klik tombol <strong>"Buka Kunci (Beri Revisi)"</strong> di laptop. Seketika itu juga layar HP klien terbuka kembali secara realtime dan mereka bisa mengubah foto pilihannya tanpa Anda perlu membuat proyek baru!
                </div>
              </div>

              {/* WATERMARK TOGGLE */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={17} color="var(--accent)" /> Watermark Foto: ON / OFF (Realtime)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                  Watermark berdesain kapsul fotografer profesional bertengger manis di bagian atas tengah foto (Top-Center) dengan nama studio Anda dan label <em>PROOF</em>.
                </p>
                <div style={{ fontSize: '12.5px', color: 'var(--text)', backgroundColor: 'var(--surface)', padding: '10px 14px', borderRadius: '10px', borderLeft: '3px solid var(--accent)' }}>
                  🛡️ <strong>Anti Screenshot & Anti Download Liar:</strong> Watermark dapat Anda hidupkan atau matikan kapan saja dengan tombol <em>Watermark: ON/OFF</em>. Efeknya langsung terlihat di layar HP klien dalam sekejap mata.
                </div>
              </div>

              {/* EXPORT TXT & DOWNLOAD HD */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={17} color="var(--text)" /> Salin Nama File, Export TXT & Unduh HD Asli
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                  Selain fitur sakti Ambil RAW otomatis, Tandain menyediakan opsi fleksibel lainnya:
                </p>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li><strong>Salin Nama File:</strong> Menyalin seluruh nama file pilihan klien ke clipboard (bisa langsung di-paste di Windows Explorer / Mac Finder / Lightroom).</li>
                  <li><strong>Export TXT:</strong> Download file list <code>.txt</code> berisi nama-nama file pilihan.</li>
                  <li><strong>Unduh Foto HD Asli:</strong> Klien dan fotografer bisa mengunduh file master beresolusi penuh langsung dari Google Drive per foto.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: CARA SAKTI AMBIL RAW LAPTOP */}
          {activeTab === 'raw_guide' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(0, 122, 255, 0.08)',
                  border: '1px solid rgba(0, 122, 255, 0.25)',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Laptop size={18} /> Mengapa Fitur "Ambil RAW" Begitu Sakti?
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
                  Di aplikasi lain, Anda harus membaca list teks WhatsApp lalu mencari satu per satu file RAW di antara ribuan foto di harddisk. Atau mengunggah puluhan GB file RAW ke cloud (yang menghabiskan kuota internet & waktu berjam-jam).
                  <br /><br />
                  <strong>Tandain bekerja 100% lokal di laptop Anda!</strong> Memakai <em>File System Access API</em> bawaan browser untuk mencari nama file yang cocok dan langsung menyalin file RAW kamera ke subfolder baru dalam beberapa detik saja!
                </p>
              </div>

              {/* LANGKAH PENGGUNAAN */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text)' }}>
                  📋 3 Langkah Mudah Mengambil RAW:
                </h4>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <li>Buka proyek di laptop menggunakan browser <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong>.</li>
                  <li>Klik tombol biru <strong>"Ambil RAW dari Laptop"</strong> di halaman detail proyek.</li>
                  <li>Di jendela pemilih folder yang muncul, arahkan ke folder tempat Anda menyimpan master RAW kamera (kartu SD / harddisk eksternal). Klik <em>Pilih Folder / Beri Akses</em>.</li>
                </ol>
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--surface)', fontSize: '12.5px', color: 'var(--text)' }}>
                  ✅ Sistem akan membuat folder baru bernama <strong><code>[Nama Proyek]_RAW_TERPILIH</code></strong> tepat di samping folder master Anda dan menyalin seluruh file RAW yang cocok secara otomatis!
                </div>
              </div>

              {/* FORMAT FILE DIDUKUNG */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDrive size={16} /> Format File RAW yang Didukung Otomatis:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12.5px' }}>
                  <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)' }}>
                    📷 <strong>Canon:</strong> <code>.CR2</code>, <code>.CR3</code>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)' }}>
                    📷 <strong>Sony:</strong> <code>.ARW</code>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)' }}>
                    📷 <strong>Nikon:</strong> <code>.NEF</code>, <code>.NRW</code>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)' }}>
                    📷 <strong>Fujifilm:</strong> <code>.RAF</code>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)' }}>
                    📷 <strong>Universal:</strong> <code>.DNG</code>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface)' }}>
                    📷 <strong>Lumix / Olympus:</strong> <code>.RW2</code>, <code>.ORF</code>
                  </div>
                </div>
              </div>

              {/* TIPS KOMPATIBILITAS */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(52, 199, 89, 0.08)',
                  border: '1px solid rgba(52, 199, 89, 0.25)',
                  fontSize: '12.5px',
                  color: 'var(--text)',
                  lineHeight: 1.5,
                }}
              >
                💡 <strong>Catatan Kompatibilitas:</strong> Fitur "Ambil RAW dari Laptop" dirancang untuk digunakan pada <strong>Laptop/Komputer Desktop</strong> (Mac, Windows, Linux) via browser Chrome atau Edge karena membutuhkan akses sistem file lokal. Untuk perangkat HP klien, mereka cukup memilih foto dengan sentuhan jari.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--surface)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            💡 Panduan ini bisa dibuka kapan saja melalui tombol <strong>Panduan & Tutorial</strong> di atas.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              className="pill-btn pill-btn-ghost"
              style={{ height: '38px', fontSize: '13px' }}
            >
              Tutup
            </button>
            {onOpenNewProject && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNewProject();
                }}
                className="pill-btn pill-btn-heart"
                style={{ height: '38px', fontSize: '13px', gap: '6px' }}
              >
                <Sparkles size={15} /> Buat Project Baru
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
