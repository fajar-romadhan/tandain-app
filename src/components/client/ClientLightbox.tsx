import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, ZoomIn, ZoomOut } from 'lucide-react';
import type { Photo } from '../../types';

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
  const [isZoomed, setIsZoomed] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showSecurityToast, setShowSecurityToast] = useState(false);
  const lastTapRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Keyboard navigation & screenshot/download prevention
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Save Page / Image
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setShowSecurityToast(true);
        setTimeout(() => setShowSecurityToast(false), 2800);
        return;
      }
      // Prevent Print / PDF
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setShowSecurityToast(true);
        setTimeout(() => setShowSecurityToast(false), 2800);
        return;
      }
      // Detect PrintScreen
      if (e.key === 'PrintScreen') {
        setShowSecurityToast(true);
        setTimeout(() => setShowSecurityToast(false), 2800);
      }

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length, currentPhoto.name, isSelected, selectedFileNames.length, quota]);

  const triggerToggle = () => {
    if (!isSelected && selectedFileNames.length >= quota) {
      // Quota full
      return;
    }
    if (!isSelected) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 700);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(12); } catch {}
      }
    }
    onToggleSelect(currentPhoto.name);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const diff = now - lastTapRef.current;
    if (diff < 300 && diff > 0) {
      triggerToggle();
    }
    lastTapRef.current = now;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
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

        <button
          onClick={() => setIsZoomed(!isZoomed)}
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
          aria-label="Zoom"
        >
          {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
        </button>
      </div>

      {/* Security Warning Toast */}
      {showSecurityToast && (
        <div
          style={{
            position: 'absolute',
            top: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(20, 20, 22, 0.94)',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            whiteSpace: 'nowrap',
          }}
        >
          🔒 Mode Preview: Unduhan & tangkapan layar dinonaktifkan untuk privasi vendor.
        </div>
      )}

      {/* Main Image Container */}
      <div
        className="no-save-preview"
        onContextMenu={(e) => {
          e.preventDefault();
          setShowSecurityToast(true);
          setTimeout(() => setShowSecurityToast(false), 2800);
        }}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: isZoomed ? 'auto' : 'hidden',
          padding: isZoomed ? '0' : '8px',
        }}
        onClick={handleDoubleTap}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.name}
          style={{
            maxWidth: isZoomed ? 'none' : '100%',
            maxHeight: isZoomed ? 'none' : 'calc(100vh - 170px)',
            width: isZoomed ? '180%' : 'auto',
            objectFit: 'contain',
            borderRadius: isZoomed ? '0' : '12px',
            transition: 'transform 0.2s ease, width 0.2s ease',
            cursor: isZoomed ? 'zoom-out' : 'pointer',
          }}
          draggable={false}
        />

        {/* Transparent Shield Layer to block mobile long-press */}
        <div className="photo-shield-layer" style={{ pointerEvents: 'none' }} />

        {/* Optional Watermark for Anti-Theft Protection */}
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
            }}
          >
            <div style={{ textAlign: 'center', transform: 'rotate(-25deg)', userSelect: 'none' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 'clamp(28px, 6vw, 56px)',
                  fontWeight: 900,
                  color: 'rgba(255, 255, 255, 0.28)',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
                  letterSpacing: '5px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {studioName || 'PREVIEW ONLY'}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 'clamp(11px, 2vw, 15px)',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: 'rgba(255, 255, 255, 0.22)',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
                  marginTop: '4px',
                }}
              >
                HAK CIPTA DILINDUNGI • BUKAN UNTUK DIUNDUH
              </span>
            </div>
          </div>
        )}

        {/* Double Tap Big Heart Burst Animation */}
        {showHeartBurst && (
          <div
            className="animate-heart-burst"
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              zIndex: 30,
              filter: 'drop-shadow(0 8px 24px rgba(255,45,85,0.7))',
            }}
          >
            <Heart size={110} fill="var(--heart)" color="var(--heart)" />
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
