import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, ZoomIn, ZoomOut, Download, Loader2 } from 'lucide-react';
import type { Photo } from '../../types';
import { downloadPhotoHd } from '../../services/photoDownload';
import { PhotoWatermark } from '../common/PhotoWatermark';

interface ClientLightboxProps {
  photos: Photo[];
  currentIndex: number;
  selectedFileNames: string[];
  quota: number;
  onClose: () => void;
  onToggleSelect: (filename: string) => void;
  onNavigate: (index: number) => void;
  hasWatermark?: boolean;
  studioName?: string;
}

export const ClientLightbox: React.FC<ClientLightboxProps> = ({
  photos,
  currentIndex,
  selectedFileNames,
  quota,
  onClose,
  onToggleSelect,
  onNavigate,
  hasWatermark = false,
  studioName = '',
}) => {
  const currentPhoto = photos[currentIndex];
  const isSelected = selectedFileNames.includes(currentPhoto.name);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const lastTapRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const isPinchingRef = useRef<boolean>(false);
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartScaleRef = useRef<number>(1);
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next <= 1.05) {
        setPanOffset({ x: 0, y: 0 });
        currentPanRef.current = { x: 0, y: 0 };
        return 1;
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    currentPanRef.current = { x: 0, y: 0 };
  };

  const handleToggleZoom = () => {
    if (zoomScale > 1.05) {
      handleResetZoom();
    } else {
      setZoomScale(2);
    }
  };

  // Reset zoom on photo navigation
  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    currentPanRef.current = { x: 0, y: 0 };
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onNavigate(currentIndex - 1);
      }
      if (e.key === 'ArrowRight') {
        if (currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
      }
      if (e.key === ' ' || e.key.toLowerCase() === 'l') {
        e.preventDefault();
        triggerToggle();
      }
      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      }
      if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      }
      if (e.key === '0') {
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length, currentPhoto.name, isSelected, selectedFileNames.length, quota]);

  const handleDownloadPhoto = async () => {
    if (!currentPhoto || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadPhotoHd(currentPhoto);
    } catch (_err) {
      // Handled in downloadPhotoHd fallback
    } finally {
      setIsDownloading(false);
    }
  };

  const triggerToggle = () => {
    if (!isSelected && selectedFileNames.length >= quota) {
      return;
    }
    if (!isSelected) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 700);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([15, 30, 20]); } catch {}
      }
    }
    onToggleSelect(currentPhoto.name);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const diff = now - lastTapRef.current;
    if (diff < 300 && diff > 0) {
      handleToggleZoom();
    }
    lastTapRef.current = now;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (zoomScale > 1.05) {
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX - currentPanRef.current.x,
        y: e.clientY - currentPanRef.current.y,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanningRef.current && zoomScale > 1.05) {
      const maxPanX = (zoomScale - 1) * 260;
      const maxPanY = (zoomScale - 1) * 320;
      const nextX = Math.max(-maxPanX, Math.min(maxPanX, e.clientX - panStartRef.current.x));
      const nextY = Math.max(-maxPanY, Math.min(maxPanY, e.clientY - panStartRef.current.y));
      currentPanRef.current = { x: nextX, y: nextY };
      setPanOffset({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Pinch-to-zoom touch detection on HP
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = zoomScale;
    } else if (e.touches.length === 1 && zoomScale <= 1.05) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinchingRef.current && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (pinchStartDistRef.current > 0) {
        const factor = dist / pinchStartDistRef.current;
        const newScale = Math.min(4, Math.max(1, pinchStartScaleRef.current * factor));
        setZoomScale(Number(newScale.toFixed(2)));
        if (newScale <= 1.05) {
          setPanOffset({ x: 0, y: 0 });
          currentPanRef.current = { x: 0, y: 0 };
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      isPinchingRef.current = false;
      if (zoomScale < 1.05) {
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
        currentPanRef.current = { x: 0, y: 0 };
      }
    }

    if (zoomScale <= 1.05 && touchStartRef.current) {
      const touch = e.changedTouches[0];
      const diffX = touch.clientX - touchStartRef.current.x;
      const diffY = touch.clientY - touchStartRef.current.y;

      // Horizontal swipe threshold
      if (Math.abs(diffX) > 48 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0 && currentIndex > 0) {
          onNavigate(currentIndex - 1);
        } else if (diffX < 0 && currentIndex < photos.length - 1) {
          onNavigate(currentIndex + 1);
        }
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar */}
      <div
        className="safe-top"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'max(14px, env(safe-area-inset-top)) 20px 14px',
          color: '#FFFFFF',
          zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>
            {currentPhoto.name}
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
            {currentIndex + 1} / {photos.length}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Download Photo Button */}
          <button
            onClick={handleDownloadPhoto}
            disabled={isDownloading}
            style={{
              height: '38px',
              padding: '0 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              cursor: isDownloading ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Unduh foto resolusi HD asli (Google Drive)"
            aria-label="Unduh foto resolusi HD asli"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span>{isDownloading ? 'Mengunduh...' : 'Unduh Foto HD'}</span>
          </button>

          {/* Glass Zoom Control Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '2px 4px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <button
              onClick={handleZoomOut}
              disabled={zoomScale <= 1}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: zoomScale <= 1 ? 'rgba(255, 255, 255, 0.35)' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: zoomScale <= 1 ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Perkecil Zoom (-)"
              aria-label="Perkecil Zoom"
            >
              <ZoomOut size={16} />
            </button>

            <button
              onClick={handleToggleZoom}
              style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: zoomScale > 1 ? 'rgba(0, 122, 255, 0.5)' : 'rgba(255, 255, 255, 0.12)',
                color: zoomScale > 1 ? '#64D2FF' : 'rgba(255, 255, 255, 0.9)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                minWidth: '42px',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
              title={zoomScale > 1 ? 'Reset zoom ke 100%' : 'Perbesar 2x'}
            >
              {Math.round(zoomScale * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={zoomScale >= 4}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: zoomScale >= 4 ? 'rgba(255, 255, 255, 0.35)' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: zoomScale >= 4 ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Perbesar Zoom (+)"
              aria-label="Perbesar Zoom"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="no-save-preview"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleDoubleTap}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '8px',
          cursor: zoomScale > 1.05 ? (isPanningRef.current ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
        }}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.name}
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 170px)',
            objectFit: 'contain',
            borderRadius: '12px',
            transform: `scale(${zoomScale}) translate3d(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px, 0)`,
            transition:
              isPinchingRef.current || isPanningRef.current
                ? 'none'
                : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable={false}
        />

        {/* Pro Photographer Watermark (Top-Center, Clean & Minimalist) */}
        {hasWatermark && (
          <PhotoWatermark studioName={studioName} size="lg" style={{ top: '24px' }} />
        )}

        {/* Double Tap Big Heart Burst Animation */}
        {showHeartBurst && (
          <div
            className="animate-heart-burst"
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              zIndex: 30,
              filter: 'drop-shadow(0 10px 32px rgba(255,45,85,0.95))',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={100} fill="var(--heart)" color="var(--heart)" />
              <span style={{ position: 'absolute', top: '-18px', right: '-16px', fontSize: '26px' }}>✨</span>
              <span style={{ position: 'absolute', bottom: '-12px', left: '-16px', fontSize: '22px' }}>💖</span>
            </div>
          </div>
        )}

        {/* Desktop Left / Right Navigation Buttons */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(currentIndex - 1);
            }}
            style={{
              position: 'absolute',
              left: '20px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              transition: 'background 0.2s',
            }}
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {currentIndex < photos.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(currentIndex + 1);
            }}
            style={{
              position: 'absolute',
              right: '20px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              transition: 'background 0.2s',
            }}
            aria-label="Foto berikutnya"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div
        className="safe-bottom"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 20px max(18px, env(safe-area-inset-bottom))',
          zIndex: 10,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
          gap: '8px',
        }}
      >
        <button
          onClick={triggerToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            height: '52px',
            padding: '0 28px',
            borderRadius: '9999px',
            backgroundColor: isSelected ? 'var(--heart)' : 'rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '16px',
            backdropFilter: 'blur(12px)',
            boxShadow: isSelected ? '0 4px 24px var(--heart-glow)' : 'none',
            transition: 'all 0.2s var(--ease-spring)',
            transform: isSelected ? 'scale(1.03)' : 'scale(1)',
          }}
        >
          <Heart
            size={22}
            fill={isSelected ? '#FFFFFF' : 'none'}
            color="#FFFFFF"
            className={isSelected ? 'animate-heart-pop' : ''}
          />
          {isSelected ? 'Udah Dipilih ❤️' : 'Pilih Foto Ini'}
        </button>

        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)' }}>
          {isSelected ? 'Masuk daftar pilihan ✨' : 'Double tap fotonya juga bisa buat milih'}
        </p>
      </div>
    </div>
  );
};
