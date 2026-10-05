import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import type { StudioProfile } from '../../types';

interface FgStudioSettingsProps {
  studio: StudioProfile;
  onSave: (updated: StudioProfile) => void;
}

const COLOR_PRESETS = [
  { name: 'Apple Black', hex: '#1D1D1F' },
  { name: 'Deep Indigo', hex: '#3B49DF' },
  { name: 'Emerald', hex: '#0D7B48' },
  { name: 'Warm Terracotta', hex: '#A34E36' },
  { name: 'Rose Luxury', hex: '#C0392B' },
];

export const FgStudioSettings: React.FC<FgStudioSettingsProps> = ({ studio, onSave }) => {
  const [studioName, setStudioName] = useState(studio.studioName);
  const [whatsapp, setWhatsapp] = useState(studio.whatsapp);
  const [accentColor, setAccentColor] = useState(studio.accentColor);
  const [waTemplate, setWaTemplate] = useState(studio.waTemplate);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...studio,
      studioName: studioName.trim(),
      whatsapp: whatsapp.replace(/[^0-9]/g, ''),
      accentColor,
      waTemplate,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
          Pengaturan Studio
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Atur nama brand, nomor WhatsApp konfirmasi, warna aksen galeri, dan template pesan WhatsApp klien.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-ios" style={{ padding: '28px' }}>
        {/* Studio Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Nama Studio / Brand Fotografer*
          </label>
          <input
            type="text"
            required
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="Misal: Tandain Studio"
            style={{
              width: '100%',
              height: '46px',
              padding: '0 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              outline: 'none',
              fontSize: '14px',
            }}
          />
        </div>

        {/* WhatsApp */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Nomor WhatsApp untuk Konfirmasi Klien*
          </label>
          <input
            type="text"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="6281234567890"
            style={{
              width: '100%',
              height: '46px',
              padding: '0 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              outline: 'none',
              fontSize: '14px',
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Gunakan format angka dengan awalan 62 (contoh: 62812xxxx).
          </p>
        </div>

        {/* Accent Color */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            Warna Aksen Tombol di Galeri Klien
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {COLOR_PRESETS.map((col) => (
              <button
                key={col.hex}
                type="button"
                onClick={() => setAccentColor(col.hex)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: accentColor === col.hex ? '2px solid var(--text)' : '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: col.hex,
                    display: 'inline-block',
                  }}
                />
                {col.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Message Template */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Template Pesan WhatsApp dari Klien
          </label>
          <textarea
            rows={4}
            value={waTemplate}
            onChange={(e) => setWaTemplate(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              outline: 'none',
              fontSize: '13px',
              lineHeight: 1.5,
              resize: 'vertical',
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Variabel otomatis: <code>{'{client_name}'}</code>, <code>{'{quota}'}</code>, <code>{'{total_selected}'}</code>
          </p>
        </div>

        <button
          type="submit"
          className="pill-btn pill-btn-primary"
          style={{ width: '100%', height: '48px', fontSize: '15px' }}
        >
          {saved ? (
            <>
              <Check size={18} /> Pengaturan Berhasil Disimpan
            </>
          ) : (
            <>
              <Save size={18} /> Simpan Pengaturan Studio
            </>
          )}
        </button>
      </form>
    </div>
  );
};
