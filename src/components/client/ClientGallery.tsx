import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Heart,
  Search,
  SlidersHorizontal,
  Layers,
  Lock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Download,
  Loader2,
} from 'lucide-react';
import { ClientLightbox } from './ClientLightbox';
import { ClientSwipeMode } from './ClientSwipeMode';
import { ClientReviewModal } from './ClientReviewModal';
import { ClientPinModal } from './ClientPinModal';
import { StatusBadge } from '../StatusBadge';
import type { Project, StudioProfile, Photo } from '../../types';
import { getDeviceId } from '../../services/storage';
import { downloadPhotoHd } from '../../services/photoDownload';

interface ClientGalleryProps {
  project: Project;
  studio: StudioProfile;
  onUpdateSelections: (fileNames: string[]) => void;
  onSubmitFinal: () => void;
  onTakeover?: () => void;
  onBackToDashboard?: () => void;
}

export const ClientGallery: React.FC<ClientGalleryProps> = ({
  project,
  studio,
  onUpdateSelections,
  onSubmitFinal,
  onTakeover,
  onBackToDashboard,
}) => {
  // PIN lock state
  const [isPinUnlocked, setIsPinUnlocked] = useState(!project.pin);
  // View states
  const [filterMode, setFilterMode] = useState<'all' | 'selected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(2);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [swipeInitialIndex, setSwipeInitialIndex] = useState<number>(0);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [burstPhotoId, setBurstPhotoId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const deviceId = getDeviceId();
  const isCurrentDeviceSelector = !project.activeSelectorDeviceId || project.activeSelectorDeviceId === deviceId;
  const activeStudioName = project.studioName || studio.studioName || 'Studio Fotografi';

  const handleDownloadPhoto = async (photo: Photo) => {
    if (!photo || downloadingId) return;
    setDownloadingId(photo.id);
    setDownloadToast(`Mengunduh ${photo.name} HD...`);
    try {
      await downloadPhotoHd(photo);
      setDownloadToast(`✓ Berhasil mengunduh ${photo.name} (HD)!`);
      setTimeout(() => setDownloadToast(null), 3000);
    } catch (_e) {
      setDownloadToast(`Membuka unduhan ${photo.name}...`);
      setTimeout(() => setDownloadToast(null), 2500);
    } finally {
      setDownloadingId(null);
    }
  };

  // Dynamic document title for client
  useEffect(() => {
    document.title = `Silahkan Tandain yaa! — Galeri ${project.clientName} 📸✨`;
    return () => {
      document.title = 'Silahkan Tandain yaa! 📸✨';
    };
  }, [project.clientName]);

  // Real-time lock & watermark toast notification for client
  const prevLockedRef = useRef(project.locked);
  const prevWmRef = useRef(project.hasWatermark);

  useEffect(() => {
    if (prevLockedRef.current !== project.locked) {
      if (!project.locked) {
        setDownloadToast('🎉 Fotografer membuka kunci galeri! Kamu bisa mengubah foto pilihan.');
      } else {
        setDownloadToast('🔒 Galeri telah dikunci oleh fotografer.');
      }
      setTimeout(() => setDownloadToast(null), 3800);
      prevLockedRef.current = project.locked;
    }
  }, [project.locked]);

  useEffect(() => {
    if (prevWmRef.current !== project.hasWatermark) {
      setDownloadToast(
        project.hasWatermark
          ? '🛡️ Watermark foto diperbarui (Aktif)'
          : '🛡️ Watermark dinonaktifkan oleh fotografer (Foto Bersih)'
      );
      setTimeout(() => setDownloadToast(null), 3200);
      prevWmRef.current = project.hasWatermark;
    }
  }, [project.hasWatermark]);

  // Filtered photos
  const displayedPhotos = useMemo(() => {
    let list = project.photos;
    if (filterMode === 'selected') {
      list = list.filter((p) => project.selectedFileNames.includes(p.name));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [project.photos, project.selectedFileNames, filterMode, searchQuery]);

  // Stable multi-column partition (Pinterest-style: eliminates column-count splitting bugs and layout shift)
  const photoColumns = useMemo(() => {
    const count = gridColumns;
    const cols: { photo: Photo; globalIndex: number }[][] = Array.from(
      { length: count },
      () => []
    );
    displayedPhotos.forEach((photo, idx) => {
      cols[idx % count].push({ photo, globalIndex: idx });
    });
    return cols;
  }, [displayedPhotos, gridColumns]);

  // Tapping any photo instantly opens Swipe Mode starting from that photo!
  const handlePhotoClick = (index: number) => {
    const clicked = displayedPhotos[index];
    if (clicked) {
      const realIndex = project.photos.findIndex((p) => p.name === clicked.name);
      setSwipeInitialIndex(realIndex >= 0 ? realIndex : 0);
    } else {
      setSwipeInitialIndex(0);
    }
    setIsSwipeMode(true);
  };

  const handleTogglePhoto = (filename: string) => {
    if (project.locked) return;
    if (!isCurrentDeviceSelector) return;

    const isSelected = project.selectedFileNames.includes(filename);

    if (!isSelected) {
      // Check quota
      if (project.selectedFileNames.length >= project.quota) {
        alert(`Jatah ${project.quota} foto kamu sudah penuh ya! Hapus salah satu foto dulu atau hubungi fotografer untuk tambah kuota.`);
        return;
      }
      // Trigger heart animation & haptic
      setBurstPhotoId(filename);
      setTimeout(() => setBurstPhotoId(null), 650);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([15, 30, 20]); } catch {}
      }
      onUpdateSelections([...project.selectedFileNames, filename]);
    } else {
      onUpdateSelections(project.selectedFileNames.filter((f) => f !== filename));
    }
  };

  if (!isPinUnlocked) {
    return <ClientPinModal project={project} studio={studio} onSuccess={() => setIsPinUnlocked(true)} />;
  }

  const progressPercent = Math.min(100, (project.selectedFileNames.length / project.quota) * 100);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: '120px' }}>
      {/* Read-Only / Other Device Warning Banner */}
      {!isCurrentDeviceSelector && !project.locked && (
        <div
          style={{
            backgroundColor: '#FFF4E5',
            borderBottom: '1px solid #FFE0B2',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="#B25E00" />
            <p style={{ fontSize: '13px', color: '#B25E00', fontWeight: 500 }}>
              HP lain lagi milih nih 👀 Kamu sekarang dalam mode lihat saja.
            </p>
          </div>
          {onTakeover && (
            <button
              onClick={onTakeover}
              className="pill-btn pill-btn-primary"
              style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}
            >
              Ambil Alih
            </button>
          )}
        </div>
      )}

      {/* Top Header */}
      <header
        className="safe-top"
        style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border-light)',
          padding: '16px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Studio & Project Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {activeStudioName}
              </p>
              <StatusBadge status={project.status} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#2E7D32',
                  backgroundColor: '#E8F5E9',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={12} /> Mode Preview Terlindungi
              </span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
              {project.clientName}
            </h1>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="pill-btn pill-btn-secondary"
                style={{ height: '38px', fontSize: '13px' }}
              >
                Dashboard FG
              </button>
            )}

            <button
              onClick={() => setIsSwipeMode(true)}
              className="pill-btn pill-btn-secondary"
              style={{ height: '38px', fontSize: '13px', gap: '6px' }}
            >
              <Layers size={16} /> Mode Swipe
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '14px auto 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search bar */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 200px',
              maxWidth: '360px',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor foto (misal 4821)..."
              style={{
                width: '100%',
                height: '40px',
                paddingLeft: '38px',
                paddingRight: '14px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                outline: 'none',
                fontSize: '16px',
              }}
            />
          </div>

          {/* Segmented Filter (Semua vs Dipilih) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--bg)',
                padding: '3px',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
              }}
            >
              <button
                onClick={() => setFilterMode('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: filterMode === 'all' ? 600 : 500,
                  backgroundColor: filterMode === 'all' ? 'var(--surface)' : 'transparent',
                  color: filterMode === 'all' ? 'var(--text)' : 'var(--text-secondary)',
                  boxShadow: filterMode === 'all' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Semua ({project.photos.length})
              </button>
              <button
                onClick={() => setFilterMode('selected')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: filterMode === 'selected' ? 600 : 500,
                  backgroundColor: filterMode === 'selected' ? 'var(--surface)' : 'transparent',
                  color: filterMode === 'selected' ? 'var(--heart)' : 'var(--text-secondary)',
                  boxShadow: filterMode === 'selected' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Dipilih ({project.selectedFileNames.length})
              </button>
            </div>

            {/* Grid Size Toggle */}
            <button
              onClick={() => setGridColumns(gridColumns === 2 ? 3 : 2)}
              className="pill-btn pill-btn-ghost"
              style={{ width: '40px', height: '40px', padding: 0 }}
              title="Ganti ukuran kotak"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Photo Gallery Grid */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 16px calc(110px + env(safe-area-inset-bottom))' }}>
        {displayedPhotos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {filterMode === 'selected' ? 'Belum ada foto yang kamu pilih nih.' : 'Foto tidak ditemukan.'}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              {filterMode === 'selected' ? 'Yuk ketuk tanda hati ❤️ di foto favoritmu!' : 'Coba kata kunci pencarian lain ya.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            {photoColumns.map((colPhotos, colIdx) => (
              <div
                key={colIdx}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minWidth: 0,
                }}
              >
                {colPhotos.map(({ photo, globalIndex }) => {
                  const isSelected = project.selectedFileNames.includes(photo.name);
                  const isBurst = burstPhotoId === photo.name;
                  const thumbUrl =
                    photo.thumbnailUrl ||
                    (photo.url?.includes('lh3.googleusercontent.com')
                      ? photo.url.replace('=w1200', '=w600')
                      : photo.url);

                  return (
                    <div
                      key={photo.id}
                      className="no-save-preview"
                      onClick={() => handlePhotoClick(globalIndex)}
                      style={{
                        position: 'relative',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        backgroundColor: '#EAEAEA',
                        cursor: 'pointer',
                        boxShadow: isSelected
                          ? '0 0 0 3px var(--heart), 0 8px 24px var(--heart-glow)'
                          : '0 2px 10px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.18s var(--ease-spring)',
                        transform: isSelected ? 'scale(0.985)' : 'scale(1)',
                        contain: 'content',
                      }}
                    >
                      <img
                        src={thumbUrl}
                        alt={photo.name}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (photo.id && !target.src.includes('drive.google.com/thumbnail')) {
                            target.src = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w600`;
                          }
                        }}
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block',
                          objectFit: 'cover',
                          pointerEvents: 'auto',
                        }}
                      />

                      {/* Anti-Screenshot Studio Watermark */}
                      {project.hasWatermark && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            zIndex: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ textAlign: 'center', transform: 'rotate(-25deg)', userSelect: 'none' }}>
                            <span
                              style={{
                                display: 'block',
                                fontSize: 'clamp(14px, 3.5vw, 20px)',
                                fontWeight: 800,
                                letterSpacing: '1.5px',
                                color: 'rgba(255, 255, 255, 0.48)',
                                textShadow: '0 1px 5px rgba(0, 0, 0, 0.7)',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {activeStudioName}
                            </span>
                            <span
                              style={{
                                display: 'block',
                                fontSize: '9px',
                                fontWeight: 600,
                                letterSpacing: '0.8px',
                                color: 'rgba(255, 255, 255, 0.4)',
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
                                marginTop: '2px',
                              }}
                            >
                              PREVIEW ONLY
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Filename Badge Top-Left */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.55)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 600,
                          letterSpacing: '0.3px',
                          maxWidth: 'calc(100% - 20px)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          zIndex: 4,
                        }}
                      >
                        {photo.name}
                      </div>

                      {/* Download HD Button Bottom-Left */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPhoto(photo);
                        }}
                        disabled={downloadingId === photo.id}
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '10px',
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.52)',
                          border: '1px solid rgba(255, 255, 255, 0.35)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          cursor: downloadingId === photo.id ? 'wait' : 'pointer',
                          zIndex: 4,
                          transition: 'all 0.18s ease',
                        }}
                        aria-label={`Unduh ${photo.name} resolusi HD`}
                        title="Unduh foto resolusi HD asli (Google Drive)"
                      >
                        {downloadingId === photo.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Download size={18} />
                        )}
                      </button>

                      {/* Corner Heart Button (Touch target 44x44px for instant like without opening swipe) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePhoto(photo.name);
                        }}
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? 'var(--heart)' : 'rgba(255, 255, 255, 0.94)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? '0 4px 18px rgba(255,45,85,0.45)' : '0 4px 14px rgba(0,0,0,0.18)',
                          backdropFilter: 'blur(8px)',
                          transition: 'all 0.22s var(--ease-spring)',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          zIndex: 4,
                        }}
                        aria-label={isSelected ? 'Batal pilih' : 'Pilih foto'}
                      >
                        {isBurst && (
                          <span
                            className="animate-heart-ripple"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              borderRadius: '50%',
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        <Heart
                          size={20}
                          fill={isSelected ? '#FFFFFF' : 'none'}
                          color={isSelected ? '#FFFFFF' : 'var(--text)'}
                          className={isSelected ? 'animate-heart-pop' : ''}
                        />
                      </button>

                      {/* Big Heart Burst Animation on toggle */}
                      {isBurst && (
                        <div
                          className="animate-heart-burst"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            zIndex: 10,
                            filter: 'drop-shadow(0 8px 24px rgba(255,45,85,0.9))',
                          }}
                        >
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Heart size={68} fill="var(--heart)" color="var(--heart)" />
                            <span style={{ position: 'absolute', top: '-14px', right: '-12px', fontSize: '18px' }}>✨</span>
                            <span style={{ position: 'absolute', bottom: '-10px', left: '-12px', fontSize: '16px' }}>💖</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Bar (Sticky Selection Counter & CTA) */}
      <div
        className="safe-bottom"
        style={{
          position: 'fixed',
          bottom: 'max(16px, calc(env(safe-area-inset-bottom) + 8px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '540px',
          zIndex: 150,
          animation: 'slideUpFade 0.3s var(--ease-smooth)',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            borderRadius: '9999px',
            padding: '10px 16px 10px 20px',
            boxShadow: 'var(--shadow-float)',
            border: '1px solid rgba(229, 229, 234, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Progress & Counter */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>
                {project.selectedFileNames.length}/{project.quota}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                foto kepilih
              </span>
            </div>
            {/* Visual Thin Pink Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--border-light)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: 'var(--heart)',
                  transition: 'width 0.25s var(--ease-spring)',
                }}
              />
            </div>
          </div>

          {/* Action Button */}
          {project.locked ? (
            <button
              onClick={() => setIsReviewOpen(true)}
              className="pill-btn pill-btn-secondary"
              style={{ height: '44px', gap: '6px' }}
            >
              <Lock size={16} /> Terkunci (Lihat)
            </button>
          ) : (
            <button
              onClick={() => setIsReviewOpen(true)}
              disabled={project.selectedFileNames.length === 0}
              className="pill-btn pill-btn-primary"
              style={{
                height: '44px',
                opacity: project.selectedFileNames.length === 0 ? 0.45 : 1,
                cursor: project.selectedFileNames.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Cek & Kirim <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <ClientLightbox
          photos={displayedPhotos}
          currentIndex={lightboxIndex}
          selectedFileNames={project.selectedFileNames}
          quota={project.quota}
          onClose={() => setLightboxIndex(null)}
          onToggleSelect={handleTogglePhoto}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          hasWatermark={project.hasWatermark}
          studioName={activeStudioName}
        />
      )}

      {/* Swipe Mode Screen - Auto triggered upon tapping any photo */}
      {isSwipeMode && (
        <ClientSwipeMode
          photos={project.photos}
          selectedFileNames={project.selectedFileNames}
          quota={project.quota}
          onToggleSelect={handleTogglePhoto}
          onClose={() => setIsSwipeMode(false)}
          hasWatermark={project.hasWatermark}
          studioName={activeStudioName}
          initialIndex={swipeInitialIndex}
        />
      )}

      {/* Review Modal */}
      <ClientReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        project={project}
        photos={project.photos}
        selectedFileNames={project.selectedFileNames}
        studio={studio}
        onRemovePhoto={(fn) => handleTogglePhoto(fn)}
        onSubmitFinal={onSubmitFinal}
      />

      {/* Floating Download HD Toast Notification */}
      {downloadToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(84px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'rgba(20, 20, 24, 0.95)',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease',
            pointerEvents: 'none',
            maxWidth: '90%',
            textAlign: 'center',
          }}
        >
          <Download size={16} />
          <span>{downloadToast}</span>
        </div>
      )}
    </div>
  );
};
