import React, { useState } from 'react';
import { X, Heart, RotateCcw, ArrowLeft } from 'lucide-react';
import type { Photo } from '../../types';

interface ClientSwipeModeProps {
  photos: Photo[];
  selectedFileNames: string[];
  quota: number;
  onToggleSelect: (filename: string) => void;
  onClose: () => void;
}

export const ClientSwipeMode: React.FC<ClientSwipeModeProps> = ({
  photos,
  selectedFileNames,
  quota,
  onToggleSelect,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ index: number; wasSelectedBefore: boolean }[]>([]);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);

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
    if (dragOffset > 90) {
      handleAction(true); // Swipe right = choose
    } else if (dragOffset < -90) {
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
          padding: '16px 20px',
        }}
      >
        <button
          onClick={onClose}
          className="pill-btn pill-btn-secondary"
          style={{ height: '38px', padding: '0 14px', fontSize: '13px' }}
        >
          <ArrowLeft size={16} /> Kembali ke Grid
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Mode Swipe
          </p>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
            {selectedFileNames.length}/{quota} Kepilih
          </p>
        </div>

        <div style={{ width: '80px', textAlign: 'right' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {currentIndex + 1}/{photos.length}
          </span>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        Swipe kanan = gaskeun, kiri = skip
      </p>

      {/* Card Deck Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '12px 24px',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentPhoto ? (
          <div
            className="card-ios"
            style={{
              width: '100%',
              maxWidth: '380px',
              height: 'calc(100vh - 240px)',
              maxHeight: '520px',
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.12)',
              transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.06}deg)`,
              transition: isDragging ? 'none' : 'transform 0.25s ease',
            }}
          >
            <img
              src={currentPhoto.url}
              alt={currentPhoto.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              draggable={false}
            />

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
          padding: '16px 20px',
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
