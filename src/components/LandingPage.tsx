import React, { useState } from 'react';
import {
  Heart,
  Laptop,
  PlusCircle,
  HardDrive,
  Download,
  ShieldCheck,
  Zap,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { SAMPLE_GRADUATION_PHOTOS, SAMPLE_WEDDING_PHOTOS } from '../services/sampleData';
import { downloadPhotoHd } from '../services/photoDownload';
import { PhotoWatermark } from './common/PhotoWatermark';
import type { AuthUser } from '../types';

interface LandingPageProps {
  onCreateGallery: () => void;
  onOpenDashboard: () => void;
  onOpenLogin?: () => void;
  user: AuthUser | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateGallery,
  onOpenDashboard,
  onOpenLogin: _onOpenLogin,
  user,
}) => {
  // Mini interactive state for the hero preview card (Prewedding & Wisuda)
  const [mockupCategory, setMockupCategory] = useState<'prewedding' | 'wisuda'>('prewedding');
  const [preweddingSelected, setPreweddingSelected] = useState<number[]>([0, 1, 3, 5]);
  const [wisudaSelected, setWisudaSelected] = useState<number[]>([0, 2, 4, 6]);

  // 1:1 Carousel Showcase state & interactive preview
  const [carouselCategory, setCarouselCategory] = useState<'all' | 'prewedding' | 'wisuda'>('all');
  const [carouselHearted, setCarouselHearted] = useState<string[]>(['wed-01', 'wisuda-02', 'wed-05', 'wisuda-07']);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [demoWatermark, setDemoWatermark] = useState<boolean>(true);
  const [isDownloadingDemo, setIsDownloadingDemo] = useState<boolean>(false);

  // Showcase item list
  const showcaseList = [
    ...SAMPLE_WEDDING_PHOTOS.map((p, idx) => ({
      ...p,
      category: 'prewedding' as const,
      vendor: 'Tandain Studio',
      label: `Prewedding Story #${String(idx + 1).padStart(2, '0')}`,
    })),
    ...SAMPLE_GRADUATION_PHOTOS.map((p, idx) => ({
      ...p,
      category: 'wisuda' as const,
      vendor: 'Studio Mahasiswa UI',
      label: `Graduation UI #${String(idx + 1).padStart(2, '0')}`,
    })),
  ];

  const filteredShowcase = showcaseList.filter((item) =>
    carouselCategory === 'all' ? true : item.category === carouselCategory
  );

  const toggleCarouselHeart = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCarouselHearted((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const currentPhotos = (mockupCategory === 'prewedding' ? SAMPLE_WEDDING_PHOTOS : SAMPLE_GRADUATION_PHOTOS).slice(0, 8);
  const currentSelected = mockupCategory === 'prewedding' ? preweddingSelected : wisudaSelected;
  const currentQuota = mockupCategory === 'prewedding' ? 50 : 30;

  const togglePreviewPhoto = (idx: number) => {
    if (mockupCategory === 'prewedding') {
      setPreweddingSelected((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
    } else {
      setWisudaSelected((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', color: '#1D1D1F' }}>
      
      {/* ─── APPLE-GRADE TOP NAVIGATION ───────────────────────────────────── */}
      <header
        className="safe-top"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'background-color 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <span style={{ fontSize: '22px' }}>📸</span>
            <span
              style={{
                fontSize: '19px',
                fontWeight: 800,
                color: '#1D1D1F',
                letterSpacing: '-0.5px',
              }}
            >
              Tandain
            </span>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#0071E3',
                backgroundColor: 'rgba(0, 113, 227, 0.08)',
                padding: '2px 8px',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Pro
            </span>
          </div>

          {/* Nav Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onOpenDashboard}
              className="pill-btn pill-btn-ghost"
              style={{
                height: '36px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1D1D1F',
                gap: '6px',
                borderRadius: '9999px',
              }}
            >
              <Laptop size={15} />
              {user ? (user.name || 'Dashboard') : 'Dashboard Fotografer'}
            </button>

            <button
              onClick={onCreateGallery}
              className="pill-btn"
              style={{
                height: '36px',
                fontSize: '13px',
                fontWeight: 600,
                padding: '0 16px',
                gap: '6px',
                borderRadius: '9999px',
                backgroundColor: '#0071E3',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0, 113, 227, 0.28)',
              }}
            >
              <PlusCircle size={15} />
              Buat Galeri
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION (APPLE MINIMALIST & IMPACTFUL) ───────────────────── */}
      <section
        style={{
          position: 'relative',
          padding: '72px 20px 64px',
          textAlign: 'center',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Eyebrow Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: '#F5F5F7',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              fontSize: '12px',
              fontWeight: 700,
              color: '#1D1D1F',
              letterSpacing: '0.02em',
              marginBottom: '22px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#34C759',
                boxShadow: '0 0 0 3px rgba(52, 199, 89, 0.2)',
              }}
            />
            <span>Solusi Kurasi Foto Terbaik untuk Fotografer & Klien</span>
          </div>

          {/* Main Apple Headline */}
          <h1
            style={{
              fontSize: 'clamp(38px, 6.2vw, 68px)',
              fontWeight: 800,
              color: '#1D1D1F',
              lineHeight: 1.06,
              letterSpacing: '-1.8px',
              marginBottom: '22px',
            }}
          >
            Seleksi foto klien.
            <br />
            <span
              style={{
                background: 'linear-gradient(180deg, #1D1D1F 30%, #6E6E73 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Cepat. Rapi. Tanpa ribet.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              color: '#6E6E73',
              lineHeight: 1.5,
              maxWidth: '680px',
              margin: '0 auto 36px',
              letterSpacing: '-0.3px',
              fontWeight: 400,
            }}
          >
            Buat galeri dari folder Google Drive dalam hitungan detik. Klien memilih langsung di HP mereka dengan tap love ❤️, dan file master RAW langsung siap disalin otomatis di laptopmu.
          </p>

          {/* Hero Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              marginBottom: '32px',
            }}
          >
            <button
              onClick={onCreateGallery}
              className="pill-btn"
              style={{
                height: '52px',
                padding: '0 28px',
                fontSize: '15.5px',
                fontWeight: 700,
                borderRadius: '9999px',
                backgroundColor: '#0071E3',
                color: '#FFFFFF',
                boxShadow: '0 4px 18px rgba(0, 113, 227, 0.35)',
                gap: '8px',
              }}
            >
              <PlusCircle size={18} />
              Buat Galeri Seleksi
            </button>

            <button
              onClick={onOpenDashboard}
              className="pill-btn"
              style={{
                height: '52px',
                padding: '0 24px',
                fontSize: '15.5px',
                fontWeight: 600,
                borderRadius: '9999px',
                backgroundColor: '#F5F5F7',
                color: '#1D1D1F',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                gap: '8px',
              }}
            >
              <Laptop size={18} />
              Buka Dashboard Fotografer
            </button>
          </div>

          {/* Apple Trust Micro Points */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: '#6E6E73',
              fontWeight: 500,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#34C759" /> Tanpa upload ulang (Google Drive)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#34C759" /> Klien pilih di HP tanpa aplikasi
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#34C759" /> Auto-salin file RAW lokal
            </span>
          </div>
        </div>

        {/* ─── HERO DEVICE FRAME (INTERACTIVE APPLE CANVAS) ─────────────────── */}
        <div
          style={{
            maxWidth: '1040px',
            margin: '52px auto 0',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Apple Hardware Frame Simulation */}
          <div
            style={{
              borderRadius: '28px',
              padding: '12px',
              backgroundColor: '#F5F5F7',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.14), 0 8px 24px -4px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* Device Preview Header Bar */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #F2F2F7',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#86868B',
                      }}
                    >
                      TANDAIN STUDIO
                    </span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34C759' }} />
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#34C759' }}>Galeri Aktif</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1D1D1F', marginTop: '2px', letterSpacing: '-0.3px' }}>
                    {mockupCategory === 'prewedding' ? 'Prewedding Aditya & Sarah' : 'Wisuda Rani Larasati, S.Ked'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6E6E73' }}>
                    {mockupCategory === 'prewedding' ? 'Outdoor & Studio • Batas kuota 50 foto album' : 'Universitas Indonesia • Batas kuota 30 foto'}
                  </div>
                </div>

                {/* Category Pill Switcher (Apple Segmented Style) */}
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: '#E5E5EA',
                    padding: '3px',
                    borderRadius: '12px',
                    gap: '2px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setMockupCategory('prewedding')}
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '9px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: mockupCategory === 'prewedding' ? '#FFFFFF' : 'transparent',
                      color: mockupCategory === 'prewedding' ? '#1D1D1F' : '#6E6E73',
                      boxShadow: mockupCategory === 'prewedding' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    💍 Prewedding
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockupCategory('wisuda')}
                    style={{
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '9px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: mockupCategory === 'wisuda' ? '#FFFFFF' : 'transparent',
                      color: mockupCategory === 'wisuda' ? '#1D1D1F' : '#6E6E73',
                      boxShadow: mockupCategory === 'wisuda' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    🎓 Wisuda
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#FAFAFC',
                  borderBottom: '1px solid #F2F2F7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div style={{ flex: 1, height: '6px', backgroundColor: '#E5E5EA', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round(((currentSelected.length + (mockupCategory === 'prewedding' ? 14 : 10)) / currentQuota) * 100))}%`,
                      backgroundColor: '#FF2D55',
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    backgroundColor: '#FFF0F3',
                    border: '1px solid #FFE0E6',
                    color: '#FF2D55',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentSelected.length + (mockupCategory === 'prewedding' ? 14 : 10)} / {currentQuota} Foto Terpilih
                </div>
              </div>

              {/* Interactive Photo Grid Preview */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '10px',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {currentPhotos.map((photo, idx) => {
                  const isSel = currentSelected.includes(idx);
                  return (
                    <div
                      key={`${mockupCategory}-${photo.id}`}
                      onClick={() => togglePreviewPhoto(idx)}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        outline: isSel ? '3px solid #FF2D55' : '1px solid rgba(0,0,0,0.06)',
                        outlineOffset: '-3px',
                        transform: isSel ? 'scale(0.97)' : 'scale(1)',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isSel ? '0 4px 14px rgba(255, 45, 85, 0.25)' : 'none',
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        loading="eager"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />

                      {/* Heart badge when selected */}
                      {isSel && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#FF2D55',
                            color: '#FFFFFF',
                            display: 'grid',
                            placeItems: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          }}
                        >
                          <Heart size={13} fill="#FFFFFF" />
                        </div>
                      )}

                      {/* Photo number badge */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.55)',
                          backdropFilter: 'blur(4px)',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        #{idx + 1}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Simulation hint */}
              <div
                style={{
                  padding: '10px',
                  textAlign: 'center',
                  backgroundColor: '#F5F5F7',
                  fontSize: '12px',
                  color: '#86868B',
                  borderTop: '1px solid #E5E5EA',
                }}
              >
                👆 <b>Simulasi Interaktif:</b> Klik foto di atas untuk memilih / membatalkan foto seperti tampilan klien di layar HP.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── APPLE BENTO GRID: FITUR UTAMA ─────────────────────────────────── */}
      <section
        style={{
          padding: '96px 20px',
          backgroundColor: '#F5F5F7',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 56px' }}>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#0071E3',
                marginBottom: '10px',
              }}
            >
              DIRANCANG UNTUK FOTOGRAFER
            </div>
            <h2
              style={{
                fontSize: 'clamp(30px, 4.4vw, 46px)',
                fontWeight: 800,
                color: '#1D1D1F',
                letterSpacing: '-1.2px',
                lineHeight: 1.15,
              }}
            >
              Semua yang kamu butuhkan.
              <br />
              Dibuat dengan presisi tinggi.
            </h2>
            <p style={{ fontSize: '16px', color: '#6E6E73', marginTop: '14px', lineHeight: 1.6 }}>
              Tidak ada lagi daftar chat nomor foto yang berantakan atau jam-jam terbuang mencari file RAW satu per satu di laptop.
            </p>
          </div>

          {/* Bento Box Grid */}
          <div className="apple-bento-grid">
            {/* Bento Card 1: Auto-Ambil RAW di Laptop (Span 7) */}
            <div
              className="apple-bento-col-7 bento-card-hover"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '36px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '340px',
              }}
            >
              <div>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(0, 113, 227, 0.1)',
                    color: '#0071E3',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <HardDrive size={24} />
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.4px', marginBottom: '10px' }}>
                  Auto-Ambil File RAW di Laptop
                </h3>
                <p style={{ fontSize: '14.5px', color: '#6E6E73', lineHeight: 1.6 }}>
                  Buka dashboard di laptop via Chrome atau Edge. Tandain otomatis membaca harddisk kamu, mencocokkan nomor file foto yang dipilih klien, dan mengemas file master RAW ke subfolder baru dalam hitungan detik.
                </p>
              </div>

              {/* Supported format tags */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '24px' }}>
                {['Canon .CR3 / .CR2', 'Sony .ARW', 'Nikon .NEF', 'Fuji .RAF', 'Universal .DNG'].map((ext) => (
                  <span
                    key={ext}
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#F5F5F7',
                      color: '#1D1D1F',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {/* Bento Card 2: Mode Swipe Klien ala Tinder di HP (Span 5) */}
            <div
              className="apple-bento-col-5 bento-card-hover"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '36px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '340px',
              }}
            >
              <div>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(255, 45, 85, 0.1)',
                    color: '#FF2D55',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <Smartphone size={24} />
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.4px', marginBottom: '10px' }}>
                  Mode Swipe ala Tinder di HP
                </h3>
                <p style={{ fontSize: '14.5px', color: '#6E6E73', lineHeight: 1.6 }}>
                  Klien menyortir foto dengan geser jempol ke kanan (suka) atau kiri (lewati). Lengkap dengan gestur pinch-to-zoom dan kunci kuota otomatis.
                </p>
              </div>

              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#FFF0F3',
                  border: '1px solid #FFE0E6',
                  color: '#FF2D55',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Heart size={16} fill="#FF2D55" />
                90%+ Klien Memilih Langsung di iPhone & Android
              </div>
            </div>

            {/* Bento Card 3: Tanpa Upload Ulang (Google Drive Langsung) (Span 4) */}
            <div
              className="apple-bento-col-4 bento-card-hover"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '30px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                  color: '#34C759',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <Zap size={22} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1D1D1F', marginBottom: '8px' }}>
                Tanpa Upload Ulang
              </h4>
              <p style={{ fontSize: '13.5px', color: '#6E6E73', lineHeight: 1.6 }}>
                Cukup tempel link folder Google Drive yang sudah kamu punya. Foto master tetap aman di Drive kamu tanpa boros kuota server.
              </p>
            </div>

            {/* Bento Card 4: Unduh Foto HD Asli (Span 4) */}
            <div
              className="apple-bento-col-4 bento-card-hover"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '30px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(88, 86, 214, 0.1)',
                  color: '#5856D6',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <Download size={22} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1D1D1F', marginBottom: '8px' }}>
                Unduh Resolusi HD Asli
              </h4>
              <p style={{ fontSize: '13.5px', color: '#6E6E73', lineHeight: 1.6 }}>
                Fotografer dan klien dapat mengunduh foto pilihan dalam resolusi HD penuh asli Google Drive langsung dari HP maupun laptop.
              </p>
            </div>

            {/* Bento Card 5: Watermark Fotografer Elegan (Span 4) */}
            <div
              className="apple-bento-col-4 bento-card-hover"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '30px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 149, 0, 0.1)',
                  color: '#FF9500',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1D1D1F', marginBottom: '8px' }}>
                Watermark Pro Otomatis
              </h4>
              <p style={{ fontSize: '13.5px', color: '#6E6E73', lineHeight: 1.6 }}>
                Watermark studio minimalis di bagian atas foto klien secara realtime. Lindungi karyamu dari screenshot liar dengan 1 kali klik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── APPLE SHOWCASE SECTION: PENGALAMAN GALERI KLIENT ──────────────── */}
      <section
        style={{
          position: 'relative',
          padding: '96px 0 80px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#FF2D55',
              marginBottom: '10px',
            }}
          >
            PENGALAMAN KLIENT
          </div>

          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 800,
              letterSpacing: '-1px',
              lineHeight: 1.15,
              color: '#1D1D1F',
              marginBottom: '14px',
            }}
          >
            Indah di setiap piksel.
          </h2>

          <p style={{ fontSize: '16px', color: '#6E6E73', maxWidth: '600px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Klien foto menikmati pengalaman kurasi yang menyenangkan langsung dari browser smartphone. Tap love ❤️ pada foto favorit, zoom layar penuh, dan kirim saat kuota pas.
          </p>

          {/* Category Filter Pills (Apple Segmented Control) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              borderRadius: '9999px',
              backgroundColor: '#F5F5F7',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              marginBottom: '36px',
            }}
          >
            <button
              type="button"
              onClick={() => setCarouselCategory('all')}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: carouselCategory === 'all' ? 700 : 500,
                color: carouselCategory === 'all' ? '#1D1D1F' : '#6E6E73',
                backgroundColor: carouselCategory === 'all' ? '#FFFFFF' : 'transparent',
                boxShadow: carouselCategory === 'all' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              Semua Momen ({showcaseList.length})
            </button>
            <button
              type="button"
              onClick={() => setCarouselCategory('prewedding')}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: carouselCategory === 'prewedding' ? 700 : 500,
                color: carouselCategory === 'prewedding' ? '#1D1D1F' : '#6E6E73',
                backgroundColor: carouselCategory === 'prewedding' ? '#FFFFFF' : 'transparent',
                boxShadow: carouselCategory === 'prewedding' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              💍 Prewedding ({SAMPLE_WEDDING_PHOTOS.length})
            </button>
            <button
              type="button"
              onClick={() => setCarouselCategory('wisuda')}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: carouselCategory === 'wisuda' ? 700 : 500,
                color: carouselCategory === 'wisuda' ? '#1D1D1F' : '#6E6E73',
                backgroundColor: carouselCategory === 'wisuda' ? '#FFFFFF' : 'transparent',
                boxShadow: carouselCategory === 'wisuda' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              🎓 Wisuda ({SAMPLE_GRADUATION_PHOTOS.length})
            </button>
          </div>
        </div>

        {/* Dual Marquee Track (Infinite Seamless Loop) */}
        <div className="carousel-track-wrapper">
          <div className="carousel-marquee-track">
            {[...filteredShowcase, ...filteredShowcase].map((item, idx) => {
              const isHearted = carouselHearted.includes(item.id);
              const realIndex = idx % filteredShowcase.length;
              return (
                <div
                  key={`marquee-1-${item.id}-${idx}`}
                  className="carousel-card-1x1 no-save-preview"
                  onClick={() => setActiveLightboxIndex(realIndex)}
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {/* Anti-Save Transparent Shield */}
                  <div className="photo-shield-layer" />

                  {/* Category Pill Tag (Top Left) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      zIndex: 3,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(0, 0, 0, 0.45)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                    }}
                  >
                    {item.category === 'prewedding' ? '💍 Prewedding' : '🎓 Wisuda'}
                  </div>

                  {/* Top Right Heart Action Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleCarouselHeart(item.id, e)}
                    aria-label="Pilih foto"
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      zIndex: 4,
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: isHearted ? '#FF2D55' : 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      color: '#FFFFFF',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      transform: isHearted ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    <Heart size={16} fill={isHearted ? '#FFFFFF' : 'none'} color="#FFFFFF" />
                  </button>

                  {/* Bottom Vignette & Metadata */}
                  <div className="overlay-scrim">
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                          letterSpacing: '-0.2px',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.85)',
                          marginTop: '2px',
                        }}
                      >
                        {item.vendor}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 9px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(255, 255, 255, 0.22)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.22)',
                        color: '#FFFFFF',
                        fontSize: '10.5px',
                        fontWeight: 600,
                      }}
                    >
                      <Eye size={12} /> Preview
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtext Under Carousel */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '13px',
            color: '#86868B',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Heart size={14} style={{ color: '#FF2D55' }} fill="#FF2D55" /> Tap love untuk simulasi seleksi foto
          </span>
          <span>•</span>
          <span>Klik foto untuk preview layar penuh & unduh HD asli</span>
        </div>
      </section>

      {/* ─── 1:1 LIGHTBOX MODAL ────────────────────────────────────────────── */}
      {activeLightboxIndex !== null && filteredShowcase[activeLightboxIndex] && (
        <div
          className="no-save-preview"
          onClick={() => setActiveLightboxIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out forwards',
          }}
        >
          {/* Top Bar Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              color: '#FFFFFF',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>
                {filteredShowcase[activeLightboxIndex].name}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                {filteredShowcase[activeLightboxIndex].vendor} • {activeLightboxIndex + 1} dari {filteredShowcase.length}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDemoWatermark(!demoWatermark)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  backgroundColor: demoWatermark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  color: demoWatermark ? '#34C759' : 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                Watermark: {demoWatermark ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => setActiveLightboxIndex(null)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  color: '#FFFFFF',
                  display: 'grid',
                  placeItems: 'center',
                  border: 'none',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 1:1 Photo Frame */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              aspectRatio: '1 / 1',
              borderRadius: '24px',
              overflow: 'hidden',
              backgroundColor: '#16161E',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <img
              src={filteredShowcase[activeLightboxIndex].url}
              alt={filteredShowcase[activeLightboxIndex].name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />

            {/* Anti-Save Shield */}
            <div className="photo-shield-layer" />

            {/* Pro Photographer Watermark */}
            {demoWatermark && (
              <PhotoWatermark
                studioName={filteredShowcase[activeLightboxIndex].vendor}
                size="md"
                style={{ top: '20px' }}
              />
            )}

            {/* Prev / Next Navigation Arrows */}
            <button
              type="button"
              onClick={() =>
                setActiveLightboxIndex(
                  (activeLightboxIndex - 1 + filteredShowcase.length) % filteredShowcase.length
                )
              }
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 5,
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveLightboxIndex((activeLightboxIndex + 1) % filteredShowcase.length)
              }
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 5,
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Bottom Interactive Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
            }}
          >
            <button
              type="button"
              onClick={async () => {
                if (activeLightboxIndex !== null && filteredShowcase[activeLightboxIndex]) {
                  const photo = filteredShowcase[activeLightboxIndex];
                  setIsDownloadingDemo(true);
                  try {
                    await downloadPhotoHd(photo);
                  } catch (err) {
                    console.error('Demo HD download failed:', err);
                  } finally {
                    setIsDownloadingDemo(false);
                  }
                }
              }}
              disabled={isDownloadingDemo}
              style={{
                height: '42px',
                padding: '0 16px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                cursor: isDownloadingDemo ? 'wait' : 'pointer',
              }}
            >
              <Download size={15} />
              {isDownloadingDemo ? 'Mengunduh...' : 'Unduh HD Asli'}
            </button>

            <button
              type="button"
              onClick={() => toggleCarouselHeart(filteredShowcase[activeLightboxIndex].id)}
              className="pill-btn"
              style={{
                height: '44px',
                padding: '0 20px',
                backgroundColor: carouselHearted.includes(filteredShowcase[activeLightboxIndex].id)
                  ? '#FF2D55'
                  : 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: 700,
                gap: '8px',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <Heart
                size={16}
                fill={carouselHearted.includes(filteredShowcase[activeLightboxIndex].id) ? '#FFFFFF' : 'none'}
              />
              {carouselHearted.includes(filteredShowcase[activeLightboxIndex].id)
                ? 'Terpilih (Tap Batalkan)'
                : 'Pilih Foto Ini'}
            </button>
          </div>
        </div>
      )}

      {/* ─── APPLE COMPARISON: CARA LAMA VS CARA TANDAIN ──────────────────── */}
      <section
        style={{
          padding: '96px 20px',
          backgroundColor: '#F5F5F7',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#86868B',
                marginBottom: '10px',
              }}
            >
              PERBANDINGAN ALUR KERJA
            </div>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                color: '#1D1D1F',
                letterSpacing: '-1.2px',
                lineHeight: 1.15,
              }}
            >
              Tinggalkan cara lama.
            </h2>
            <p style={{ fontSize: '16px', color: '#6E6E73', marginTop: '12px', lineHeight: 1.6 }}>
              Lihat bagaimana Tandain mengubah proses kurasi foto yang tadinya berbelit menjadi otomatis dan menyenangkan.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Cara Lama (WhatsApp Chat Manual) */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '36px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFF0F0',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '20px',
                }}
              >
                ⚠️ Cara Manual di WhatsApp
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1D1D1F', marginBottom: '14px' }}>
                Melelahkan & Rentan Salah
              </h3>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  'Klien mengetik nomor foto manual ("012, 018, eh ganti 020 aja kak")',
                  'Fotografer bolak-balik scroll riwayat chat untuk rekap nomor foto',
                  'Sering salah hitung kuota foto (melebihi atau kurang dari perjanjian paket)',
                  'Mencari satu per satu file RAW di harddisk laptop yang memakan waktu berjam-jam',
                ].map((text, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#6E6E73', lineHeight: 1.5 }}>
                    <span style={{ color: '#DC2626', fontWeight: 800, fontSize: '16px' }}>✕</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cara Modern (Tandain) */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '36px',
                border: '2px solid #0071E3',
                boxShadow: '0 12px 36px rgba(0, 113, 227, 0.12)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(0, 113, 227, 0.1)',
                  color: '#0071E3',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '20px',
                }}
              >
                ✨ Alur Kerja Modern Tandain
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1D1D1F', marginBottom: '14px' }}>
                100% Otomatis & Presisi
              </h3>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  'Klien memilih dengan tap love ❤️ langsung di galeri web via WhatsApp',
                  'Batas kuota terkunci otomatis, klien tidak bisa memilih lebih dari paket',
                  'Daftar foto terpilih langsung terurut rapi di dashboard fotografer secara realtime',
                  'Auto-Ambil RAW di laptop via Chrome/Edge — 1 klik file langsung tersalin!',
                ].map((text, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#1D1D1F', lineHeight: 1.5, fontWeight: 500 }}>
                    <CheckCircle2 size={18} color="#0071E3" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3 STEP WORKFLOW: ALUR KERJA SIMPEL ────────────────────────────── */}
      <section style={{ maxWidth: '1040px', margin: '0 auto', padding: '96px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 52px' }}>
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#86868B',
              marginBottom: '10px',
            }}
          >
            MUDAH DIGUNAKAN
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#1D1D1F', letterSpacing: '-1.2px' }}>
            Tiga langkah sederhana.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Step 1 */}
          <div
            style={{
              padding: '32px',
              borderRadius: '24px',
              backgroundColor: '#F5F5F7',
              border: '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 900,
                color: '#0071E3',
                marginBottom: '16px',
                letterSpacing: '0.08em',
              }}
            >
              LANGKAH 01
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#1D1D1F', marginBottom: '10px' }}>
              Tempel Link Google Drive
            </h3>
            <p style={{ fontSize: '14px', color: '#6E6E73', lineHeight: 1.6 }}>
              Upload foto JPG preview ke folder Google Drive, buat proyek di Tandain, dan dapatkan link galeri unik siap kirim dalam 15 detik.
            </p>
          </div>

          {/* Step 2 */}
          <div
            style={{
              padding: '32px',
              borderRadius: '24px',
              backgroundColor: '#F5F5F7',
              border: '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 900,
                color: '#FF2D55',
                marginBottom: '16px',
                letterSpacing: '0.08em',
              }}
            >
              LANGKAH 02
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#1D1D1F', marginBottom: '10px' }}>
              Klien Tap Love di HP
            </h3>
            <p style={{ fontSize: '14px', color: '#6E6E73', lineHeight: 1.6 }}>
              Klien membuka link galeri langsung dari chat WhatsApp. Mereka memilih foto favorit dengan sentuhan cinta ❤️ hingga kuota pas.
            </p>
          </div>

          {/* Step 3 */}
          <div
            style={{
              padding: '32px',
              borderRadius: '24px',
              backgroundColor: '#F5F5F7',
              border: '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 900,
                color: '#34C759',
                marginBottom: '16px',
                letterSpacing: '0.08em',
              }}
            >
              LANGKAH 03
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#1D1D1F', marginBottom: '10px' }}>
              Auto-Ambil RAW di Laptop
            </h3>
            <p style={{ fontSize: '14px', color: '#6E6E73', lineHeight: 1.6 }}>
              Buka dashboard fotografer di laptop, klik "Ambil RAW". Sistem otomatis mencari dan menyalin file RAW master ke folder baru. Selesai!
            </p>
          </div>
        </div>
      </section>

      {/* ─── APPLE DARK FINALE CTA BANNER ─────────────────────────────────── */}
      <section
        style={{
          maxWidth: '1080px',
          margin: '0 auto 80px',
          padding: '0 20px',
        }}
      >
        <div
          style={{
            backgroundColor: '#000000',
            color: '#FFFFFF',
            padding: '72px 36px',
            textAlign: 'center',
            borderRadius: '32px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Subtle Apple Radial Lighting */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '600px',
              height: '350px',
              background: 'radial-gradient(circle, rgba(0, 113, 227, 0.28) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <h2
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              marginBottom: '16px',
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
              position: 'relative',
              zIndex: 2,
            }}
          >
            Mulai kurasi foto dengan
            <br />
            standar studio profesional.
          </h2>

          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '520px',
              margin: '0 auto 36px',
              lineHeight: 1.6,
              position: 'relative',
              zIndex: 2,
            }}
          >
            Tingkatkan kepuasan klien foto kamu dan hemat waktu berjam-jam setiap minggu. Tanpa sistem token, tanpa biaya tersembunyi.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            <button
              onClick={onCreateGallery}
              className="pill-btn"
              style={{
                height: '52px',
                padding: '0 30px',
                fontSize: '15.5px',
                fontWeight: 700,
                borderRadius: '9999px',
                backgroundColor: '#0071E3',
                color: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(0, 113, 227, 0.45)',
                gap: '8px',
              }}
            >
              <PlusCircle size={18} />
              Buat Galeri Seleksi Sekarang
            </button>

            <button
              onClick={onOpenDashboard}
              className="pill-btn"
              style={{
                height: '52px',
                padding: '0 24px',
                fontSize: '15.5px',
                fontWeight: 600,
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                gap: '8px',
              }}
            >
              <Laptop size={18} />
              Dashboard Fotografer
            </button>
          </div>
        </div>
      </section>

      {/* ─── MINIMALIST APPLE FOOTER ──────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          padding: '36px 20px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#86868B',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 800, color: '#1D1D1F' }}>Tandain</span>
            <span>— Modern Photo Selection & RAW Matcher untuk Fotografer.</span>
          </div>
          <div>
            100% Client-Side Privacy • Google Drive Integrated
          </div>
        </div>
      </footer>

    </div>
  );
};
