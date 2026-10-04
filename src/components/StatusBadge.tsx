import React from 'react';
import type { ProjectStatus } from '../types';

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'belum_dibuka':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
          style={{ backgroundColor: 'var(--status-gray-bg)', color: 'var(--status-gray-text)' }}
        >
          Belum dibuka
        </span>
      );
    case 'lagi_milih':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
          style={{ backgroundColor: 'var(--status-amber-bg)', color: 'var(--status-amber-text)' }}
        >
          Lagi milih
        </span>
      );
    case 'udah_kirim':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
          style={{ backgroundColor: 'var(--status-pink-bg)', color: 'var(--status-pink-text)' }}
        >
          Udah kirim 🎉
        </span>
      );
    case 'selesai':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
          style={{ backgroundColor: 'var(--status-green-bg)', color: 'var(--status-green-text)' }}
        >
          Selesai ✓
        </span>
      );
    default:
      return null;
  }
};
