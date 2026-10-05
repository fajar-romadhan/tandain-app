import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface ModernDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
  value,
  onChange,
  label = 'Tanggal Sesi Foto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial selected date or fallback to today
  const parseDate = (dStr: string) => {
    if (!dStr) return new Date();
    const [y, m, d] = dStr.split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  };

  const selectedDate = parseDate(value);

  // Calendar navigation state (currently viewed month and year)
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth());

  // Keep view in sync when value changes externally
  useEffect(() => {
    const d = parseDate(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const formatToYmd = (year: number, monthIndex: number, day: number) => {
    const m = String(monthIndex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const handleSelectDay = (year: number, monthIndex: number, day: number) => {
    const ymd = formatToYmd(year, monthIndex, day);
    onChange(ymd);
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const ymd = formatToYmd(today.getFullYear(), today.getMonth(), today.getDate());
    onChange(ymd);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleSelectYesterday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const ymd = formatToYmd(d.getFullYear(), d.getMonth(), d.getDate());
    onChange(ymd);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setIsOpen(false);
  };

  // Build grid days
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthCells: { day: number; year: number; month: number }[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    prevMonthCells.push({ day: d, year: y, month: m });
  }

  const currentMonthCells: { day: number; year: number; month: number }[] = [];
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    currentMonthCells.push({ day: i, year: viewYear, month: viewMonth });
  }

  const remainingCellsCount = (7 - ((prevMonthCells.length + currentMonthCells.length) % 7)) % 7;
  const nextMonthCells: { day: number; year: number; month: number }[] = [];
  for (let i = 1; i <= remainingCellsCount; i++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    nextMonthCells.push({ day: i, year: y, month: m });
  }

  // Format readable label
  const formattedReadableDate = () => {
    if (!value) return 'Pilih Tanggal Sesi';
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return value;
    const dateObj = new Date(y, m - 1, d);
    const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dateObj.getDay()];
    return `${dayName}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
  };

  const todayStr = formatToYmd(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const isToday = value === todayStr;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}

      {/* Trigger Button Field */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: '44px',
          padding: '0 14px',
          borderRadius: '12px',
          border: isOpen ? '1.5px solid var(--accent)' : '1px solid var(--border)',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(0, 122, 255, 0.12)' : 'none',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 122, 255, 0.08)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarIcon size={16} />
          </div>
          <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text)' }}>
            {formattedReadableDate()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isToday && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(52, 199, 89, 0.12)',
                color: '#34C759',
              }}
            >
              Hari Ini
            </span>
          )}
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Modern Popover Calendar Card */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 100,
            width: '100%',
            maxWidth: '340px',
            backgroundColor: 'var(--surface)',
            borderRadius: '18px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.16)',
            padding: '16px',
            animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            userSelect: 'none',
          }}
        >
          {/* Calendar Header: Month + Year & Nav Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                title="Bulan sebelumnya"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                title="Bulan berikutnya"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={handleSelectToday}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--surface-sunken)',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handleSelectYesterday}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--surface-sunken)',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Kemarin
            </button>
          </div>

          {/* Day of Week Labels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              marginBottom: '6px',
            }}
          >
            {DAY_NAMES.map((name, i) => (
              <span
                key={name}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: i === 0 ? 'var(--heart)' : 'var(--text-tertiary)',
                  padding: '4px 0',
                }}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
            }}
          >
            {/* Prev month padding */}
            {prevMonthCells.map((cell) => (
              <button
                key={`prev-${cell.year}-${cell.month}-${cell.day}`}
                type="button"
                onClick={() => handleSelectDay(cell.year, cell.month, cell.day)}
                style={{
                  height: '34px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-tertiary)',
                  opacity: 0.35,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {cell.day}
              </button>
            ))}

            {/* Current month days */}
            {currentMonthCells.map((cell) => {
              const ymd = formatToYmd(cell.year, cell.month, cell.day);
              const isSelected = ymd === value;
              const isCurrentToday = ymd === todayStr;

              return (
                <button
                  key={`cur-${cell.day}`}
                  type="button"
                  onClick={() => handleSelectDay(cell.year, cell.month, cell.day)}
                  style={{
                    height: '34px',
                    borderRadius: '10px',
                    border: isCurrentToday && !isSelected ? '1px solid var(--accent)' : 'none',
                    backgroundColor: isSelected ? 'var(--text)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : 'var(--text)',
                    fontSize: '13px',
                    fontWeight: isSelected || isCurrentToday ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: isSelected ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <span>{cell.day}</span>
                  {isSelected && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: '#34C759',
                      }}
                    />
                  )}
                </button>
              );
            })}

            {/* Next month padding */}
            {nextMonthCells.map((cell) => (
              <button
                key={`next-${cell.year}-${cell.month}-${cell.day}`}
                type="button"
                onClick={() => handleSelectDay(cell.year, cell.month, cell.day)}
                style={{
                  height: '34px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-tertiary)',
                  opacity: 0.35,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {cell.day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
