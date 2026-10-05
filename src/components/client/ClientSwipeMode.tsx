import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, RotateCcw, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Download, Loader2 } from 'lucide-react';
import type { Photo } from '../../types';
import { downloadPhotoHd } from '../../services/photoDownload';
import { PhotoWatermark } from '../common/PhotoWatermark';

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
  // Initialize to initialIndex clamped to valid range
  const [currentIndex, setCurrentIndex] = useState<number>(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, photos.length - 1)))
  );

  const [history, setHistory] = useState<{ index: number; wasSelectedBefore: boolean }[]>([]);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [exitDirection, setExitDirection] = useState<'right' | 'left' | null>(null);
  const [quotaToast, setQuotaToast] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const handleDownload = async (photo: Photo) => {
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

  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const dragOffsetRef = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const isHorizontalGestureRef = useRef<boolean | null>(null);

  // Preload next images for 0-latency instant rendering
  useEffect(() => {
    [currentIndex + 1, currentIndex + 2, currentIndex + 3].forEach((idx) => {
      if (photos[idx]) {
        const img = new Image();
        img.src = photos[idx].url || photos[idx].thumbnailUrl || '';
      }
    });
  }, [currentIndex, photos]);

  const currentPhoto = photos[currentIndex];
  const nextPhoto = photos[currentIndex + 1];
  const isSelected = currentPhoto ? selectedFileNames.includes(currentPhoto.name) : false;

  // Trigger swipe action (Choose = right, Skip = left)
  const triggerSwipe = useCallback(
    (choose: boolean) => {
      if (exitDirection) return; // Prevent double trigger while animating exit
      const photo = photos[currentIndex];
      if (!photo) return;

      const photoSelected = selectedFileNames.includes(photo.name);

      if (choose) {
        // Swiping right: PILIH
        if (!photoSelected) {
          if (selectedFileNames.length >= quota) {
            // Quota is full! Show toast and bounce back
            setQuotaToast(`Kuota ${quota} foto sudah penuh! Batalkan foto lain dulu atau lewati foto ini.`);
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate([40, 60, 40]); } catch {}
            }
            setDragOffset(0);
            dragOffsetRef.current = 0;
            return;
          }
          onToggleSelect(photo.name);
        }
      } else {
        // Swiping left: LEWATI
        if (photoSelected) {
          onToggleSelect(photo.name);
        }
      }

      // Record history for Undo
      setHistory((prev) => [...prev, { index: currentIndex, wasSelectedBefore: photoSelected }]);

      // Trigger Bumble-style fly-out exit animation
      setExitDirection(choose ? 'right' : 'left');
      setDragOffset(0);
      dragOffsetRef.current = 0;

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(choose ? [15, 25, 20] : 12);
        } catch {}
      }

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setExitDirection(null);
      }, 250);
    },
    [currentIndex, exitDirection, photos, selectedFileNames, quota, onToggleSelect]
  );

  // Undo last swipe
  const handleUndo = useCallback(() => {
    if (exitDirection) return;
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const prevPhoto = photos[last.index];
      if (prevPhoto) {
        const currentlySelected = selectedFileNames.includes(prevPhoto.name);
        if (currentlySelected !== last.wasSelectedBefore) {
          onToggleSelect(prevPhoto.name);
        }
      }
      setCurrentIndex(last.index);
      setDragOffset(0);
      dragOffsetRef.current = 0;
      return prev.slice(0, -1);
    });
  }, [exitDirection, photos, selectedFileNames, onToggleSelect]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') triggerSwipe(true);
      if (e.key === 'ArrowLeft') triggerSwipe(false);
      if (e.key === 'Backspace' || e.key.toLowerCase() === 'z') handleUndo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSwipe, handleUndo, onClose]);

  // Auto-dismiss quota toast
  useEffect(() => {
    if (!quotaToast) return;
    const t = setTimeout(() => setQuotaToast(null), 3000);
    return () => clearTimeout(t);
  }, [quotaToast]);

  // ---------------------------------------------------------------------------
  // Pointer Event Handlers (Rock-solid for touch, mouse, and trackpad gestures)
  // ---------------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (exitDirection || !currentPhoto) return;
    // Only respond to primary button (left mouse or primary touch)
    if (e.button !== 0) return;

    isPointerDownRef.current = true;
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    dragOffsetRef.current = 0;
    isHorizontalGestureRef.current = null;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const diffX = e.clientX - startXRef.current;
    const diffY = e.clientY - startYRef.current;

    // Detect gesture axis on initial movement (> 6px)
    if (isHorizontalGestureRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalGestureRef.current = Math.abs(diffX) >= Math.abs(diffY);
      }
    }

    if (isHorizontalGestureRef.current === true) {
      dragOffsetRef.current = diffX;
      setDragOffset(diffX);
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    isPointerDownRef.current = false;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const offset = dragOffsetRef.current;
    const threshold = 65; // swipe trigger threshold in px

    if (offset > threshold) {
      triggerSwipe(true); // Swipe right -> choose
    } else if (offset < -threshold) {
      triggerSwipe(false); // Swipe left -> skip
    } else {
      // Bounce back to center
      setDragOffset(0);
      dragOffsetRef.current = 0;
    }
  };

  // Stamp opacity calculation
  const rightOpacity = Math.min(1, Math.max(0, dragOffset / 55));
  const leftOpacity = Math.min(1, Math.max(0, -dragOffset / 55));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: '#0F0F12',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      {/* Top Header */}
      <div
        className="safe-top"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'max(14px, env(safe-area-inset-top)) 16px 8px',
          zIndex: 10,
        }}
      >
        <button
          onClick={onClose}
          className="pill-btn pill-btn-secondary"
          style={{ height: '38px', padding: '0 14px', fontSize: '13px', gap: '6px' }}
        >
          <ArrowLeft size={16} /> Galeri Grid
        </button>

        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            Mode Swipe Seleksi
          </p>
          <p style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
            {selectedFileNames.length}/{quota} Foto Dipilih
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)' }}>
            {Math.min(currentIndex + 1, photos.length)} / {photos.length}
          </span>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
            title="Tutup Mode Swipe"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Quota Toast Notification */}
      {quotaToast && (
        <div
          style={{
            position: 'absolute',
            top: '75px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            backgroundColor: '#FF9500',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(255, 149, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '90%',
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <AlertCircle size={18} />
          <span>{quotaToast}</span>
        </div>
      )}

      {/* Download Toast Notification */}
      {downloadToast && (
        <div
          style={{
            position: 'absolute',
            top: '75px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            backgroundColor: 'rgba(20, 20, 24, 0.95)',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '90%',
            textAlign: 'center',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Download size={16} />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Guidance micro-text */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.55)',
          marginBottom: '4px',
          zIndex: 5,
        }}
      >
        👉 Geser kanan = <b style={{ color: '#34C759' }}>PILIH ❤️</b> &nbsp;•&nbsp; Geser kiri ={' '}
        <b style={{ color: '#FF3B30' }}>LEWATI ✕</b>
      </p>

      {/* Card Deck Area (Bumble / Tinder Stack) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '4px 16px 12px',
          overflow: 'hidden',
        }}
      >
        {/* Navigation Arrows for Laptop / Tablet */}
        {currentIndex > 0 && currentPhoto && (
          <button
            type="button"
            onClick={handleUndo}
            style={{
              position: 'absolute',
              left: 'max(12px, calc(50% - 245px))',
              zIndex: 30,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1C1C1E',
              cursor: 'pointer',
            }}
            title="Undo / Foto Sebelumnya"
            aria-label="Undo"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {currentIndex < photos.length && currentPhoto && (
          <button
            type="button"
            onClick={() => triggerSwipe(false)}
            style={{
              position: 'absolute',
              right: 'max(12px, calc(50% - 245px))',
              zIndex: 30,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1C1C1E',
              cursor: 'pointer',
            }}
            title="Lewati Foto Ini"
            aria-label="Lewati"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* --- Card 2: Background Card (Smoothly scales up from beneath) --- */}
        {nextPhoto && (
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              height: 'calc(100vh - 240px)',
              maxHeight: '560px',
              position: 'absolute',
              borderRadius: '24px',
              overflow: 'hidden',
              backgroundColor: '#18181B',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              zIndex: 1,
              willChange: 'transform, opacity',
              transform: `translate3d(0, ${10 - Math.min(10, Math.abs(dragOffset) / 35)}px, 0) scale(${
                0.94 + Math.min(0.06, Math.abs(dragOffset) / 600)
              })`,
              opacity: 0.75 + Math.min(0.25, Math.abs(dragOffset) / 250),
              transition: isDragging ? 'none' : 'transform 0.24s ease, opacity 0.24s ease',
              pointerEvents: 'none',
            }}
          >
            <img
              src={nextPhoto.url || nextPhoto.thumbnailUrl}
              alt={nextPhoto.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                backgroundColor: '#121214',
              }}
              draggable={false}
            />
          </div>
        )}

        {/* --- Card 1: Active Top Card --- */}
        {currentPhoto ? (
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="card-ios"
            style={{
              width: '100%',
              maxWidth: '420px',
              height: 'calc(100vh - 240px)',
              maxHeight: '560px',
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              backgroundColor: '#121214',
              boxShadow: '0 18px 45px rgba(0, 0, 0, 0.45)',
              zIndex: 2,
              touchAction: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
              willChange: 'transform, opacity',
              transform:
                exitDirection === 'right'
                  ? 'translate3d(120vw, 20px, 0) rotate(24deg)'
                  : exitDirection === 'left'
                  ? 'translate3d(-120vw, 20px, 0) rotate(-24deg)'
                  : `translate3d(${dragOffset}px, ${Math.abs(dragOffset) * 0.08}px, 0) rotate(${dragOffset * 0.045}deg)`,
              opacity: exitDirection ? 0 : 1,
              transition: isDragging
                ? 'none'
                : exitDirection
                ? 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out'
                : 'transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.25)',
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
                pointerEvents: 'none',
              }}
              draggable={false}
            />

            {/* Pro Photographer Watermark (Top-Center, Clean & Minimalist) */}
            {hasWatermark && (
              <PhotoWatermark studioName={studioName} size="md" />
            )}

            {/* Gradient Overlay for Photo Details & Direct Download Button */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '24px 18px 16px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 65%, transparent 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                zIndex: 4,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: '16px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentPhoto.name}
                </p>
                <p style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                  {isSelected ? '❤️ Sudah masuk daftar pilihanmu' : 'Geser kanan ❤️ untuk memilih'}
                </p>
              </div>

              {/* Direct Card Download HD Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(currentPhoto);
                }}
                disabled={downloadingId === currentPhoto.id}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: downloadingId === currentPhoto.id ? 'wait' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                  transition: 'all 0.18s ease',
                  pointerEvents: 'auto',
                }}
                title="Unduh foto resolusi HD asli dari Google Drive"
                aria-label={`Unduh ${currentPhoto.name} HD`}
              >
                {downloadingId === currentPhoto.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>{downloadingId === currentPhoto.id ? 'Mengunduh...' : 'Unduh HD'}</span>
              </button>
            </div>

            {/* Bumble-Style Swipe Right Stamp (PILIH ❤️) */}
            <div
              style={{
                position: 'absolute',
                top: '28px',
                right: '24px',
                padding: '6px 16px',
                border: '3px solid #34C759',
                borderRadius: '14px',
                color: '#34C759',
                fontWeight: 900,
                fontSize: '20px',
                transform: `rotate(14deg) scale(${0.85 + rightOpacity * 0.25})`,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                boxShadow: '0 4px 16px rgba(52, 199, 89, 0.45)',
                opacity: rightOpacity,
                pointerEvents: 'none',
                transition: isDragging ? 'none' : 'opacity 0.15s ease, transform 0.15s ease',
              }}
            >
              PILIH ❤️
            </div>

            {/* Bumble-Style Swipe Left Stamp (LEWATI ✕) */}
            <div
              style={{
                position: 'absolute',
                top: '28px',
                left: '24px',
                padding: '6px 16px',
                border: '3px solid #FF3B30',
                borderRadius: '14px',
                color: '#FF3B30',
                fontWeight: 900,
                fontSize: '20px',
                transform: `rotate(-14deg) scale(${0.85 + leftOpacity * 0.25})`,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                boxShadow: '0 4px 16px rgba(255, 59, 48, 0.45)',
                opacity: leftOpacity,
                pointerEvents: 'none',
                transition: isDragging ? 'none' : 'opacity 0.15s ease, transform 0.15s ease',
              }}
            >
              LEWATI ✕
            </div>
          </div>
        ) : (
          /* Finished All Photos Screen */
          <div
            style={{
              textAlign: 'center',
              padding: '36px 24px',
              backgroundColor: '#18181B',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(52, 199, 89, 0.15)',
                color: '#34C759',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <p style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
              Semua Foto Selesai Dilihat! 🎉
            </p>

            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>
              Kamu telah memilih <b style={{ color: '#FF2D55' }}>{selectedFileNames.length}</b> dari jatah{' '}
              <b>{quota}</b> foto.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={onClose}
                className="pill-btn pill-btn-primary"
                style={{ width: '100%', height: '48px', fontSize: '15px', fontWeight: 700 }}
              >
                Cek & Kirim Pilihan
              </button>

              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setDragOffset(0);
                }}
                className="pill-btn pill-btn-secondary"
                style={{ width: '100%', height: '44px', fontSize: '14px', gap: '6px' }}
              >
                <RotateCcw size={16} /> Ulangi dari Awal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Swipe Action Controls (Ergonomic Thumb Zone) */}
      <div
        className="safe-bottom"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '10px 20px max(20px, env(safe-area-inset-bottom))',
          zIndex: 10,
        }}
      >
        {/* Skip (Left) Button */}
        <button
          onClick={() => triggerSwipe(false)}
          disabled={!currentPhoto || !!exitDirection}
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF3B30',
            cursor: !currentPhoto ? 'not-allowed' : 'pointer',
            opacity: !currentPhoto ? 0.4 : 1,
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
          aria-label="Lewati foto"
          title="Lewati (Geser Kiri)"
        >
          <X size={28} strokeWidth={2.5} />
        </button>

        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0 || !!exitDirection}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: history.length === 0 ? 'rgba(255, 255, 255, 0.25)' : '#FFCC00',
            opacity: history.length === 0 ? 0.35 : 1,
            cursor: history.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'transform 0.15s ease',
          }}
          aria-label="Batal aksi terakhir"
          title="Batal aksi sebelumnya"
        >
          <RotateCcw size={19} />
        </button>

        {/* Download HD Button (Ergonomic Thumb Access) */}
        <button
          onClick={() => currentPhoto && handleDownload(currentPhoto)}
          disabled={!currentPhoto || downloadingId === currentPhoto.id}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: !currentPhoto ? 'not-allowed' : 'pointer',
            opacity: !currentPhoto ? 0.4 : 1,
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
          aria-label="Unduh foto resolusi HD asli"
          title="Unduh Foto HD Asli (Google Drive)"
        >
          {downloadingId === currentPhoto?.id ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Download size={20} />
          )}
        </button>

        {/* Heart / Choose (Right) Button */}
        <button
          onClick={() => triggerSwipe(true)}
          disabled={!currentPhoto || !!exitDirection}
          style={{
            width: '66px',
            height: '66px',
            borderRadius: '50%',
            backgroundColor: '#FF2D55',
            border: 'none',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(255, 45, 85, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: !currentPhoto ? 'not-allowed' : 'pointer',
            opacity: !currentPhoto ? 0.4 : 1,
            transition: 'transform 0.15s ease',
          }}
          aria-label="Pilih foto ini"
          title="Pilih Foto (Geser Kanan)"
        >
          <Heart size={32} fill="#FFFFFF" />
        </button>
      </div>
    </div>
  );
};
