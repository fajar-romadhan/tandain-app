import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Inbox, CheckCircle2 } from 'lucide-react';
import type { ProjectStatus } from '../types';

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
  animateOnChange?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  animateOnChange = true,
}) => {
  const prevStatusRef = useRef<ProjectStatus>(status);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (prevStatusRef.current !== status) {
      prevStatusRef.current = status;
      if (animateOnChange) {
        setAnimating(true);
        const timer = setTimeout(() => setAnimating(false), 700);
        return () => clearTimeout(timer);
      }
    }
  }, [status, animateOnChange]);

  const animationClass = animating
    ? status === 'udah_kirim'
      ? 'animate-badge-pop'
      : status === 'selesai'
      ? 'animate-badge-success'
      : 'animate-badge-pop'
    : '';

  switch (status) {
    case 'belum_dibuka':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${animationClass} ${className}`}
          style={{
            backgroundColor: 'rgba(142, 142, 147, 0.1)',
            color: '#636366',
            border: '1px solid rgba(142, 142, 147, 0.22)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.25s ease',
          }}
        >
          <Inbox size={12} />
          <span>Belum dibuka</span>
        </span>
      );
    case 'lagi_milih':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${animationClass} ${className}`}
          style={{
            backgroundColor: 'rgba(255, 149, 0, 0.12)',
            color: '#B25E00',
            border: '1px solid rgba(255, 149, 0, 0.28)',
            boxShadow: '0 1px 4px rgba(255, 149, 0, 0.08)',
            transition: 'all 0.25s ease',
          }}
        >
          <span className="status-dot-pulse" style={{ backgroundColor: '#FF9500' }} />
          <span>Lagi milih</span>
        </span>
      );
    case 'udah_kirim':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold ${animationClass} ${className}`}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 45, 85, 0.15) 0%, rgba(255, 45, 85, 0.08) 100%)',
            color: '#D70040',
            border: '1px solid rgba(255, 45, 85, 0.32)',
            boxShadow: '0 2px 8px rgba(255, 45, 85, 0.14)',
            letterSpacing: '-0.1px',
            transition: 'all 0.25s ease',
          }}
        >
          <Sparkles size={13} style={{ color: '#FF2D55' }} />
          <span>Udah kirim 🎉</span>
        </span>
      );
    case 'selesai':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold ${animationClass} ${className}`}
          style={{
            background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.15) 0%, rgba(52, 199, 89, 0.08) 100%)',
            color: '#1F8A3B',
            border: '1px solid rgba(52, 199, 89, 0.32)',
            boxShadow: '0 2px 8px rgba(52, 199, 89, 0.12)',
            transition: 'all 0.25s ease',
          }}
        >
          <CheckCircle2 size={13} style={{ color: '#34C759' }} />
          <span>Selesai ✓</span>
        </span>
      );
    default:
      return null;
  }
};
