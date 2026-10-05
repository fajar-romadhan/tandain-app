import React from 'react';
import { Camera } from 'lucide-react';

interface PhotoWatermarkProps {
  studioName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * PhotoWatermark - Clean, minimalist, professional photographer proof watermark badge.
 * Designed to sit top-center on photo cards without blocking subjects.
 */
export const PhotoWatermark: React.FC<PhotoWatermarkProps> = ({
  studioName,
  size = 'md',
  className = '',
  style = {},
}) => {
  const displayBrand = (studioName && studioName.trim().length > 0)
    ? studioName.trim()
    : 'TANDAIN STUDIO';

  // Responsive sizing based on context (grid thumbnail vs swipe card vs lightbox)
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSize = isSm ? 10 : isLg ? 13 : 11;
  const fontSize = isSm ? '9px' : isLg ? '11.5px' : '10.5px';
  const tagSize = isSm ? '7.5px' : isLg ? '9.5px' : '8.5px';
  const padding = isSm ? '3px 9px' : isLg ? '5px 14px' : '4px 12px';
  const gap = isSm ? '4px' : '6px';
  const topPos = isSm ? '8px' : isLg ? '18px' : '14px';

  return (
    <div
      className={`pro-photo-watermark ${className}`}
      style={{
        position: 'absolute',
        top: topPos,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 5,
        pointerEvents: 'none',
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        padding,
        backgroundColor: 'rgba(10, 12, 18, 0.62)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '9999px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
        maxWidth: isSm ? '82%' : '88%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        animation: 'fadeInWatermark 0.25s ease-out forwards',
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Photographer Camera Icon */}
      <Camera
        size={iconSize}
        strokeWidth={2.4}
        style={{
          color: 'rgba(255, 255, 255, 0.92)',
          flexShrink: 0,
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))',
        }}
      />

      {/* Brand / Studio Name */}
      <span
        style={{
          color: '#FFFFFF',
          fontSize,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: isSm ? '100px' : '180px',
        }}
      >
        {displayBrand}
      </span>

      {/* Elegant Separator */}
      <span
        style={{
          color: 'rgba(255, 255, 255, 0.35)',
          fontSize: '9px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        •
      </span>

      {/* Pro Proof / Preview Tag */}
      <span
        style={{
          color: 'rgba(255, 255, 255, 0.72)',
          fontSize: tagSize,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        PROOF
      </span>
    </div>
  );
};
