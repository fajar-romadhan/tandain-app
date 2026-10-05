import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, RotateCcw, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Photo } from '../../types';

interface ClientSwipeModeProps {
  photos: Photo[];
  selectedFileNames: string[];
  quota: number;
  onToggleSelect: (filename: string) => void;
  onClose: () => void;
  hasWatermark?: boolean;
  studioName?: string;
  initialIndex?: number;
}

export const ClientSwipeMode: React.FC<ClientSwipeModeProps> = ({
  photos,
  selectedFileNames,
  quota,
  onToggleSelect,
  onClose,
  hasWatermark = false,
  studioName,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(initialIndex, photos.length - 1))
  );
  const [history, setHistory] = useState<{ index: number; wasSelectedBefore: boolean }[]>([]);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Sync initialIndex when changed
  useEffect(() => {
    if (typeof initialIndex === 'number' && initialIndex >= 0 && initialIndex < photos.length) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, photos.length]);

  // Preload next images for 0-latency instant rendering
  useEffect(() => {
    [currentIndex + 1, currentIndex + 2].forEach((idx) => {
      if (photos[idx]) {
        const img = new Image();
        img.src = photos[idx].url || photos[idx].thumbnailUrl || '';
      }
    });
  }, [currentIndex, photos]);

  const currentPhoto = photos[currentIndex];
  const isSelected = currentPhoto ? selectedFileNames.includes(currentPhoto.name) : false;

  const handleAction = (choose: boolean) => {
    if (!currentPhoto) return;
    setHistory((prev) => [...prev, { index: currentIndex, wasSelectedBefore: isSelected }]);

    if (choose && !isSelected) {
      if (selectedFileNames.length < quota) {
        onToggleSelect(currentPhoto.name);
      }
    } else if (!choose && isSelected) {
      onToggleSelect(currentPhoto.name);
    }

    if (currentIndex < photos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
    setDragOffset(0);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setDragOffset(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setDragOffset(0);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(last.index);

    const prevPhoto = photos[last.index];
    const currentlySelected = selectedFileNames.includes(prevPhoto.name);
    if (currentlySelected !== last.wasSelectedBefore) {
      onToggleSelect(prevPhoto.name);
    }
    setDragOffset(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleAction(true);
      if (e.key === 'ArrowLeft') handleAction(false);
      if (e.key === 'Backspace' || e.key.toLowerCase() === 'z') handleUndo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isSelected, selectedFileNames.length, quota, history]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 75) {
      handleAction(true); // Swipe right = choose
    } else if (dragOffset < -75) {
      handleAction(false); // Swipe left = skip
    }
    setDragOffset(0);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Top Header */}
      <div
        className="safe-top"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'max(14px, env(safe-area-inset-top)) 16px 10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onClose}
            className="pill-btn pill-btn-secondary"
            style={{ height: '38px', padding: '0 14px', fontSize: '13px', gap: '6px' }}
          >
            <ArrowLeft size={16} /> Galeri Grid
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Mode Swipe Seleksi
          </p>
          <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
            {selectedFileNames.length}/{quota} Foto Dipilih
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)' }}>
            {currentIndex + 1} / {photos.length}
          </span>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
            }}
            title="Tutup Mode Swipe"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
        👉 Geser kanan = <b>PILIH ❤️</b> &nbsp;•&nbsp; Geser kiri = <b>LEWATI ✕</b>
      </p>

      {/* Card Deck Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '8px 16px',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrows for Tablet / Desktop */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handlePrevious}
            style={{
              position: 'absolute',
              left: 'max(10px, calc(50% - 245px))',
              zIndex: 20,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
            title="Foto Sebelumnya"
            aria-label="Sebelumnya"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {currentIndex < photos.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: 'max(10px, calc(50% - 245px))',
              zIndex: 20,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
            title="Foto Berikutnya"
            aria-label="Berikutnya"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {currentPhoto ? (
          <div
            ref={cardRef}
            className="card-ios no-save-preview"
            onContextMenu={(e) => e.preventDefault()}
            style={{
              width: '100%',
              maxWidth: '420px',
              height: 'calc(100vh - 230px)',
              maxHeight: '560px',
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              backgroundColor: '#121214',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
              transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
              transition: isDragging ? 'none' : 'transform 0.25s ease',
            }}
          >
            <img
              src={currentPhoto.url || currentPhoto.thumbnailUrl}
              alt={currentPhoto.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
              draggable={false}
            />

            {/* Anti-Download Shield Layer */}
            <div className="photo-shield-layer" style={{ pointerEvents: 'none' }} />

            {/* Anti-Screenshot Studio Watermark */}
            {hasWatermark && (
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
                      fontSize: 'clamp(20px, 5vw, 32px)',
                      fontWeight: 800,
                      letterSpacing: '2px',
                      color: 'rgba(255, 255, 255, 0.45)',
                      textShadow: '0 1px 6px rgba(0, 0, 0, 0.7)',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {studioName || 'PREVIEW ONLY'}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      color: 'rgba(255, 255, 255, 0.4)',
                      textShadow: '0 1px 4px rgba(0, 0, 0, 0.7)',
                      marginTop: '2px',
                    }}
                  >
                    PREVIEW ONLY • JAGA PRIVASI VENDOR
                  </span>
                </div>
              </div>
            )}

            {/* Gradient Overlay for Title */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '24px 20px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                color: '#FFFFFF',
              }}
            >
              <p style={{ fontSize: '16px', fontWeight: 700 }}>{currentPhoto.name}</p>
              <p style={{ fontSize: '12px', opacity: 0.8 }}>
                {isSelected ? 'Sudah masuk pilihanmu ❤️' : 'Ketuk hati atau geser kanan'}
              </p>
            </div>

            {/* Swipe Right Stamp */}
            {dragOffset > 40 && (
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  padding: '6px 14px',
                  border: '3px solid #34C759',
                  borderRadius: '12px',
                  color: '#34C759',
                  fontWeight: 800,
                  fontSize: '18px',
                  transform: 'rotate(15deg)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                PILIH ❤️
              </div>
            )}

            {/* Swipe Left Stamp */}
            {dragOffset < -40 && (
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  left: '24px',
                  padding: '6px 14px',
                  border: '3px solid #8E8E93',
                  borderRadius: '12px',
                  color: '#8E8E93',
                  fontWeight: 800,
                  fontSize: '18px',
                  transform: 'rotate(-15deg)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                SKIP
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Semua foto sudah dilihat! 🎉</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Kamu sudah memilih {selectedFileNames.length} foto.
            </p>
            <button onClick={onClose} className="pill-btn pill-btn-primary">
              Cek & Kirim Pilihan
            </button>
          </div>
        )}
      </div>

      {/* Bottom Swipe Controls */}
      <div
        className="safe-bottom"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          padding: '12px 20px max(20px, env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={() => handleAction(false)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            transition: 'transform 0.15s ease',
          }}
          aria-label="Lewati"
        >
          <X size={26} />
        </button>

        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: history.length === 0 ? 'var(--border)' : 'var(--text-secondary)',
            opacity: history.length === 0 ? 0.4 : 1,
            cursor: history.length === 0 ? 'not-allowed' : 'pointer',
          }}
          aria-label="Batal aksi terakhir"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={() => handleAction(true)}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--heart)',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px var(--heart-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease',
          }}
          aria-label="Pilih foto"
        >
          <Heart size={30} fill="#FFFFFF" />
        </button>
      </div>
    </div>
  );
};
