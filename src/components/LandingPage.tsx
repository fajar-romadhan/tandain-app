import React, { useState } from 'react';
import {
  Heart,
  ArrowRight,
  Laptop,
  Check,
  PlusCircle,
  HardDrive,
  Sliders,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Zap,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SAMPLE_GRADUATION_PHOTOS, SAMPLE_WEDDING_PHOTOS } from '../services/sampleData';
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

  // Showcase item list
  const showcaseList = [
    ...SAMPLE_WEDDING_PHOTOS.map((p, idx) => ({
      ...p,
      category: 'prewedding' as const,
      vendor: 'Budi Visual Story',
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Top Navbar */}
      <header
        className="safe-top"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-light)',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1160px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>📸</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>
              Tandain
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <button
                onClick={onOpenDashboard}
                className="pill-btn pill-btn-ghost"
                style={{ height: '38px', fontSize: '13.5px', fontWeight: 600, gap: '6px' }}
              >
                <Laptop size={16} /> {user.name || 'Dashboard'}
              </button>
            ) : (
              <button
                onClick={onOpenDashboard}
                className="pill-btn pill-btn-ghost"
                style={{ height: '38px', fontSize: '13.5px', fontWeight: 600, gap: '6px' }}
              >
                <Laptop size={16} /> Dashboard Fotografer
              </button>
            )}

            <button
              onClick={onCreateGallery}
              className="pill-btn pill-btn-primary"
              style={{ height: '38px', fontSize: '13.5px', fontWeight: 600, padding: '0 18px', gap: '6px' }}
            >
              <PlusCircle size={15} /> Buat Galeri Seleksi
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: '1160px',
          margin: '0 auto',
          padding: '56px 20px 48px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Copy & Actions */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.07)',
                color: 'var(--text)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}
            >
              <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#34C759' }} />
              <span>Untuk Fotografer</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(34px, 4.8vw, 54px)',
                fontWeight: 800,
                color: 'var(--text)',
                lineHeight: 1.12,
                letterSpacing: '-1px',
                marginBottom: '20px',
              }}
            >
              Seleksi foto klien, <span style={{ color: 'var(--heart)' }}>rapi tanpa ribet.</span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(15px, 2vw, 17px)',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                marginBottom: '32px',
                maxWidth: '520px',
              }}
            >
              Buat galeri dari folder Google Drive, bagikan linknya, dan biarkan klien memilih sendiri di HP. Hasil pilihannya langsung siap diproses — auto-salin file RAW di laptop atau impor ke Lightroom.
            </p>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '28px',
              }}
            >
              <button
                onClick={onCreateGallery}
                className="pill-btn pill-btn-primary"
                style={{
                  height: '50px',
                  padding: '0 26px',
                  fontSize: '15px',
                  fontWeight: 700,
                  gap: '8px',
                }}
              >
                <PlusCircle size={18} /> Buat Galeri Baru
              </button>

              <button
                onClick={onOpenDashboard}
                className="pill-btn pill-btn-secondary"
                style={{
                  height: '50px',
                  padding: '0 22px',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                <Laptop size={18} /> Buka Dashboard
              </button>
            </div>

            {/* Trust Points */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Check size={16} color="#34C759" /> Tanpa upload ulang foto
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Check size={16} color="#34C759" /> Bermerek studiomu
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Check size={16} color="#34C759" /> Auto-salin RAW lokal
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Gallery Mockup (ATM from Pilihin) */}
          <div
            className="card-ios"
            style={{
              padding: '0',
              overflow: 'hidden',
              boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Header of Mockup */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-light)',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                      BUDI VISUAL STORY
                    </span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34C759', display: 'inline-block' }} />
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#34C759' }}>Online</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginTop: '2px', letterSpacing: '-0.3px' }}>
                    {mockupCategory === 'prewedding' ? 'Prewedding Aditya & Sarah' : 'Wisuda Rani Larasati, S.Ked'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {mockupCategory === 'prewedding' ? 'Outdoor & Studio • Pilih 50 foto album' : 'Universitas Indonesia • Pilih 30 foto'}
                  </div>
                </div>

                {/* Category Pill Switcher */}
                <div style={{ display: 'flex', backgroundColor: '#F0F0F2', padding: '3px', borderRadius: '10px', gap: '3px' }}>
                  <button
                    type="button"
                    onClick={() => setMockupCategory('prewedding')}
                    style={{
                      border: 'none',
                      padding: '5px 11px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: mockupCategory === 'prewedding' ? '#FFFFFF' : 'transparent',
                      color: mockupCategory === 'prewedding' ? 'var(--text)' : 'var(--text-secondary)',
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
                      padding: '5px 11px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: mockupCategory === 'wisuda' ? '#FFFFFF' : 'transparent',
                      color: mockupCategory === 'wisuda' ? 'var(--text)' : 'var(--text-secondary)',
                      boxShadow: mockupCategory === 'wisuda' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    🎓 Wisuda
                  </button>
                </div>
              </div>

              {/* Progress Bar & Counter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, height: '6px', backgroundColor: '#EBEBF0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round(((currentSelected.length + (mockupCategory === 'prewedding' ? 14 : 10)) / currentQuota) * 100))}%`,
                      backgroundColor: 'var(--heart)',
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#FFF0F3',
                    border: '1px solid #FFE0E6',
                    color: 'var(--heart)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentSelected.length + (mockupCategory === 'prewedding' ? 14 : 10)} <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>/ {currentQuota}</span>
                </div>
              </div>
            </div>

            {/* Photo Grid Preview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                padding: '14px',
                backgroundColor: '#FAF9F8',
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
                      borderRadius: '10px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      outline: isSel ? '2.5px solid var(--heart)' : '1px solid rgba(0,0,0,0.06)',
                      outlineOffset: '-2.5px',
                      transform: isSel ? 'scale(0.97)' : 'scale(1)',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSel ? '0 4px 12px rgba(255, 45, 85, 0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
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
                          top: '6px',
                          right: '6px',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--heart)',
                          color: '#FFFFFF',
                          display: 'grid',
                          placeItems: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          animation: 'pulse 0.2s ease-in-out',
                        }}
                      >
                        <Heart size={12} fill="#FFFFFF" />
                      </div>
                    )}

                    {/* Photo index badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '5px',
                        padding: '1px 5px',
                        borderRadius: '5px',
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFFFFF',
                        fontSize: '9.5px',
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mockup Bottom Action Bar */}
            <div
              style={{
                padding: '12px 18px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} color="var(--primary)" /> Tap foto untuk coba pilih
              </span>
              <button
                onClick={onCreateGallery}
                className="pill-btn pill-btn-primary"
                style={{ height: '34px', fontSize: '12.5px', padding: '0 16px', gap: '5px' }}
              >
                Kirim Pilihan WA <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row (ATM from Pilihin) */}
      <section
        style={{
          borderTop: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div
          style={{
            maxWidth: '1160px',
            margin: '0 auto',
            padding: '36px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '24px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)' }}>15 dtk</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Galeri siap dibagikan</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)' }}>0 GB</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Upload ulang (tetap di Drive)</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#34C759' }}>100%</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Bebas kuota tanpa sistem token</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)' }}>5 dtk</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Salin file RAW di laptop</div>
          </div>
        </div>
      </section>

      {/* 1:1 Aspect Ratio Photo Preview Carousel Showcase */}
      <section
        style={{
          position: 'relative',
          padding: '76px 0 54px',
          overflow: 'hidden',
          backgroundColor: '#0C0C12',
          color: '#FFFFFF',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Soft Ambient Light Blobs (Pure CSS blur, 60 FPS) */}
        <div
          className="ambient-glow-circle"
          style={{
            top: '-40px',
            left: '15%',
            width: '340px',
            height: '340px',
            background: 'radial-gradient(circle, rgba(255, 45, 85, 0.18) 0%, transparent 70%)',
          }}
        />
        <div
          className="ambient-glow-circle"
          style={{
            bottom: '-40px',
            right: '15%',
            width: '380px',
            height: '380px',
            background: 'radial-gradient(circle, rgba(0, 122, 255, 0.14) 0%, transparent 70%)',
          }}
        />

        <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FF7A90',
                fontSize: '11.5px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '14px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Sparkles size={13} />
              <span>Preview 1:1 Aspect Ratio • Estetika Modern</span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(26px, 3.8vw, 38px)',
                fontWeight: 800,
                letterSpacing: '-0.6px',
                lineHeight: 1.18,
                marginBottom: '14px',
              }}
            >
              Tampilan Galeri 1:1 yang <span style={{ color: 'var(--heart)' }}>Elegan & Cepat</span>
            </h2>

            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.6 }}>
              Klien foto fokus pada ekspresi dan kehangatan momen tanpa distraksi visual. Animasi halus 60 FPS, proteksi anti-save, serta tap love interaktif.
            </p>

            {/* Category Filter Pills */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '22px',
                padding: '4px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <button
                type="button"
                onClick={() => setCarouselCategory('all')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: carouselCategory === 'all' ? '#0C0C12' : 'rgba(255,255,255,0.7)',
                  backgroundColor: carouselCategory === 'all' ? '#FFFFFF' : 'transparent',
                  transition: 'all 0.18s ease',
                }}
              >
                Semua Momen ({showcaseList.length})
              </button>
              <button
                type="button"
                onClick={() => setCarouselCategory('prewedding')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: carouselCategory === 'prewedding' ? '#0C0C12' : 'rgba(255,255,255,0.7)',
                  backgroundColor: carouselCategory === 'prewedding' ? '#FFFFFF' : 'transparent',
                  transition: 'all 0.18s ease',
                }}
              >
                💍 Prewedding ({SAMPLE_WEDDING_PHOTOS.length})
              </button>
              <button
                type="button"
                onClick={() => setCarouselCategory('wisuda')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: carouselCategory === 'wisuda' ? '#0C0C12' : 'rgba(255,255,255,0.7)',
                  backgroundColor: carouselCategory === 'wisuda' ? '#FFFFFF' : 'transparent',
                  transition: 'all 0.18s ease',
                }}
              >
                🎓 Wisuda ({SAMPLE_GRADUATION_PHOTOS.length})
              </button>
            </div>
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

                  {/* Watermark Tag */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      zIndex: 3,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.55)',
                      backdropFilter: 'blur(6px)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.category === 'prewedding' ? '💍 Prewedding' : '🎓 Wisuda'}
                  </div>

                  {/* Top Right Heart Action */}
                  <button
                    type="button"
                    onClick={(e) => toggleCarouselHeart(item.id, e)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 4,
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isHearted ? 'var(--heart)' : 'rgba(0, 0, 0, 0.45)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      display: 'grid',
                      placeItems: 'center',
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      transform: isHearted ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    <Heart size={16} fill={isHearted ? '#FFFFFF' : 'none'} />
                  </button>

                  {/* Bottom Vignette & Metadata */}
                  <div className="overlay-info" style={{ zIndex: 3 }}>
                    <div />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{item.vendor}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.9)' }}>
                          <Eye size={12} /> Tap preview
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Caption Hint Under Carousel */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.55)', padding: '0 20px', position: 'relative', zIndex: 1 }}>
          💡 Sentuh atau hover foto untuk jeda • Klik foto untuk simulasi preview layar penuh 1:1
        </div>
      </section>

      {/* 1:1 Classy Lightbox Preview Modal */}
      {activeLightboxIndex !== null && filteredShowcase[activeLightboxIndex] && (
        <div
          className="no-save-preview"
          onClick={() => setActiveLightboxIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            backgroundColor: 'rgba(7, 7, 10, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
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

            {/* Optional Subtle Watermark Overlay */}
            {demoWatermark && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 3,
                  display: 'grid',
                  placeItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    transform: 'rotate(-25deg)',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: 'clamp(18px, 4.5vw, 28px)',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    border: '3px dashed rgba(255, 255, 255, 0.3)',
                    padding: '8px 20px',
                    borderRadius: '12px',
                  }}
                >
                  {filteredShowcase[activeLightboxIndex].vendor}
                </div>
              </div>
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
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
              🔒 Mode preview privasi (anti-download)
            </span>

            <button
              type="button"
              onClick={() => toggleCarouselHeart(filteredShowcase[activeLightboxIndex].id)}
              className="pill-btn"
              style={{
                height: '44px',
                padding: '0 20px',
                backgroundColor: carouselHearted.includes(filteredShowcase[activeLightboxIndex].id)
                  ? 'var(--heart)'
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

      {/* Problem Section: Seleksi via WhatsApp itu melelahkan */}
      <section
        style={{
          maxWidth: '1160px',
          margin: '0 auto',
          padding: '80px 20px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                marginBottom: '12px',
              }}
            >
              MASALAHNYA
            </div>
            <h2
              style={{
                fontSize: 'clamp(28px, 3.8vw, 40px)',
                fontWeight: 800,
                color: 'var(--text)',
                lineHeight: 1.2,
                marginBottom: '18px',
              }}
            >
              Seleksi foto lewat WhatsApp itu <i>melelahkan</i>.
            </h2>
            <p
              style={{
                fontSize: '15.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                maxWidth: '460px',
              }}
            >
              Daftar nomor foto berantakan, bolak-balik chat, salah hitung, dan salah nomor file. Belum lagi kamu harus mencari satu per satu file RAW di harddisk laptop. Waktu edit berhargamu habis untuk hal yang seharusnya otomatis.
            </p>
          </div>

          {/* WhatsApp Chat Chaos Mockup */}
          <div
            className="card-ios"
            style={{
              padding: '24px',
              maxWidth: '460px',
              margin: '0 auto',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--border-light)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <MessageSquare size={16} /> Klien · Chat WhatsApp
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#F2F2F7', padding: '10px 14px', borderRadius: '14px', fontSize: '13.5px' }}>
                "Kak yang nomor 012, 018, 025, 033 bagus"
              </div>
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#F2F2F7', padding: '10px 14px', borderRadius: '14px', fontSize: '13.5px' }}>
                "Eh 018 ganti 020 aja deh kak 🙏"
              </div>
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#F2F2F7', padding: '10px 14px', borderRadius: '14px', fontSize: '13.5px' }}>
                "Yang foto baju merah nomor berapa ya?"
              </div>
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#F2F2F7', padding: '10px 14px', borderRadius: '14px', fontSize: '13.5px' }}>
                "Total boleh berapa foto ya kak tadinya?"
              </div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--heart)', fontWeight: 600, textAlign: 'right' }}>
              ⚠️ Waktu habis cuma buat rekap nomor foto manual
            </div>
          </div>
        </div>
      </section>

      {/* 6 Key Benefits (ATM from Pilihin) */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)',
          padding: '80px 20px',
        }}
      >
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 52px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                marginBottom: '10px',
              }}
            >
              KENAPA TANDAIN
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 38px)', fontWeight: 800, color: 'var(--text)' }}>
              Workflow kurasi foto yang seharusnya.
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.6 }}>
              Dibuat khusus untuk fotografer. Membuat galeri cepat, klien senang memilihnya, dan hasil seleksi langsung siap masuk Lightroom atau folder RAW.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Card 1 */}
            <div className="card-ios" style={{ padding: '28px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255, 45, 85, 0.08)', display: 'grid', placeItems: 'center', color: 'var(--heart)', marginBottom: '18px' }}>
                <Heart size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Akhiri seleksi via chat</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Klien memilih langsung di galeri elegan bermerek studiomu. Hasilnya terurut rapi — tak ada lagi daftar nomor manual yang bikin pusing.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card-ios" style={{ padding: '28px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(52, 199, 89, 0.1)', display: 'grid', placeItems: 'center', color: '#34C759', marginBottom: '18px' }}>
                <Zap size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Auto-Ambil RAW di Laptop</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Cukup buka di laptop via Chrome/Edge, sistem otomatis mencari file master RAW (.CR3, .ARW, .NEF) di harddiskmu dan menyalinnya ke folder baru secara instan.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card-ios" style={{ padding: '28px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(0, 122, 255, 0.08)', display: 'grid', placeItems: 'center', color: '#007AFF', marginBottom: '18px' }}>
                <Sliders size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Langsung ke Adobe Lightroom</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Salin format kode filter filename dalam 1 klik, lalu tempel di Library Filter Lightroom Classic untuk menyaring foto pilihan klien secara instan.
              </p>
            </div>

            {/* Card 4 */}
            <div className="card-ios" style={{ padding: '28px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(88, 86, 214, 0.08)', display: 'grid', placeItems: 'center', color: '#5856D6', marginBottom: '18px' }}>
                <HardDrive size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Tanpa upload ulang foto</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Cukup tempel link folder Google Drive yang sudah kamu punya. Foto tetap aman di Drive fotografer tanpa perlu memindahkan file bergiga-giga.
              </p>
            </div>

            {/* Card 5 */}
            <div className="card-ios" style={{ padding: '28px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255, 149, 0, 0.08)', display: 'grid', placeItems: 'center', color: '#FF9500', marginBottom: '18px' }}>
                <Sparkles size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Klien memilih dengan nyaman</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Mode Swipe ala Tinder di HP, double-tap love ❤️, pencarian nomor foto, dan batas kuota yang terkunci pas begitu jumlah tercapai.
              </p>
            </div>

            {/* Card 6 */}
            <div className="card-ios" style={{ padding: '28px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(52, 199, 89, 0.08)', display: 'grid', placeItems: 'center', color: '#34C759', marginBottom: '18px' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Bermerek studiomu</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Nama studio fotografer tampil di header galeri klien. Galeri terlihat profesional dan terpercaya di mata klien fotomu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Step Workflow */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 20px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '40px', color: 'var(--text)' }}>
          Alur kerja simpel 3 langkah
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          <div className="card-ios" style={{ padding: '26px' }}>
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>📁</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>1. Tempel Link Google Drive</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Upload preview JPG ke Google Drive, tempel link folder di Tandain. Dalam 15 detik, link galeri siap dikirim ke klien.
            </p>
          </div>

          <div className="card-ios" style={{ padding: '26px' }}>
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>❤️</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>2. Klien Tap Love di HP</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Klien membuka link tanpa perlu login atau instal aplikasi. Mereka memilih foto dengan tap love atau swipe santai.
            </p>
          </div>

          <div className="card-ios" style={{ padding: '26px' }}>
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>⚡</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>3. Auto-Ambil RAW di Laptop</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Buka di laptop, klik "Ambil RAW". Sistem langsung mencocokkan dan menyalin file RAW yang dipilih klien ke subfolder baru.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section
        style={{
          maxWidth: '1160px',
          margin: '0 auto 80px',
          padding: '0 20px',
        }}
      >
        <div
          className="card-ios"
          style={{
            backgroundColor: '#1D1D1F',
            color: '#FFFFFF',
            padding: '56px 32px',
            textAlign: 'center',
            borderRadius: '28px',
          }}
        >
          <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 38px)', fontWeight: 800, marginBottom: '14px', letterSpacing: '-0.5px' }}>
            Siap kurasi foto lebih cepat & rapi?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Buat galeri pertamamu sekarang. Tanpa pusing ngetik manual, tanpa bayar token.
          </p>
          <button
            onClick={onCreateGallery}
            className="pill-btn pill-btn-primary"
            style={{
              height: '50px',
              padding: '0 28px',
              fontSize: '15px',
              fontWeight: 700,
              gap: '8px',
            }}
          >
            <PlusCircle size={18} /> Buat Galeri Seleksi Sekarang
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          padding: '28px 20px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-tertiary)',
        }}
      >
        <p>Tandain — Modern Photo Selector & RAW Matcher untuk Fotografer.</p>
      </footer>
    </div>
  );
};
