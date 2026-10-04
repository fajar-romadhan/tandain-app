import React, { useState, useMemo, useRef } from 'react';
import {
  Heart,
  Search,
  SlidersHorizontal,
  Layers,
  Lock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ClientLightbox } from './ClientLightbox';
import { ClientSwipeMode } from './ClientSwipeMode';
import { ClientReviewModal } from './ClientReviewModal';
import { ClientPinModal } from './ClientPinModal';
import { StatusBadge } from '../StatusBadge';
import type { Project, StudioProfile } from '../../types';
import { getDeviceId } from '../../services/storage';

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
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [burstPhotoId, setBurstPhotoId] = useState<string | null>(null);

  const deviceId = getDeviceId();
  const isCurrentDeviceSelector = !project.activeSelectorDeviceId || project.activeSelectorDeviceId === deviceId;

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

  // Double tap handler per photo
  const tapTimesRef = useRef<{ [key: string]: number }>({});

  const handlePhotoClick = (index: number, photoName: string) => {
    const now = Date.now();
    const lastTap = tapTimesRef.current[photoName] || 0;
    const diff = now - lastTap;

    if (diff < 300 && diff > 0) {
      // Double tap detected -> toggle select!
      handleTogglePhoto(photoName);
      tapTimesRef.current[photoName] = 0;
    } else {
      // Single tap -> open lightbox after short delay if no 2nd tap
      tapTimesRef.current[photoName] = now;
      setTimeout(() => {
        if (Date.now() - tapTimesRef.current[photoName] >= 280 && tapTimesRef.current[photoName] !== 0) {
          setLightboxIndex(index);
        }
      }, 290);
    }
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
      setTimeout(() => setBurstPhotoId(null), 600);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(10); } catch {}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {studio.studioName}
              </p>
              <StatusBadge status={project.status} />
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
                fontSize: '14px',
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
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
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
              columnCount: gridColumns,
              columnGap: '12px',
            }}
          >
            {displayedPhotos.map((photo, index) => {
              const isSelected = project.selectedFileNames.includes(photo.name);
              const isBurst = burstPhotoId === photo.name;

              return (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoClick(index, photo.name)}
                  style={{
                    breakInside: 'avoid',
                    marginBottom: '12px',
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: '#E5E5EA',
                    cursor: 'pointer',
                    boxShadow: isSelected
                      ? '0 0 0 3px var(--heart), 0 8px 20px var(--heart-glow)'
                      : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s var(--ease-spring)',
                    transform: isSelected ? 'scale(0.985)' : 'scale(1)',
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    loading="lazy"
                    style={{
                      width: '100%',
                      display: 'block',
                      objectFit: 'cover',
                    }}
                  />

                  {/* Corner Heart Button (44x44px touch target) */}
                  <button
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
                      backgroundColor: isSelected ? 'var(--heart)' : 'rgba(255, 255, 255, 0.92)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.18s var(--ease-spring)',
                      zIndex: 2,
                    }}
                    aria-label={isSelected ? 'Batal pilih' : 'Pilih foto'}
                  >
                    <Heart
                      size={20}
                      fill={isSelected ? '#FFFFFF' : 'none'}
                      color={isSelected ? '#FFFFFF' : 'var(--text)'}
                      className={isSelected ? 'animate-heart-pop' : ''}
                    />
                  </button>

                  {/* Big Heart Burst in Center on double tap */}
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
                      }}
                    >
                      <Heart size={64} fill="var(--heart)" color="var(--heart)" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Bar (Sticky Selection Counter & CTA) */}
      <div
        className="safe-bottom"
        style={{
          position: 'fixed',
          bottom: '16px',
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
          studioName={studio.studioName}
        />
      )}

      {/* Swipe Mode Screen */}
      {isSwipeMode && (
        <ClientSwipeMode
          photos={project.photos}
          selectedFileNames={project.selectedFileNames}
          quota={project.quota}
          onToggleSelect={handleTogglePhoto}
          onClose={() => setIsSwipeMode(false)}
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
    </div>
  );
};
