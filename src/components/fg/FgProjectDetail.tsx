import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  HardDrive,
  Sliders,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Unlock,
  Lock,
  Share2,
  Trash2,
  RefreshCw,
  Eye,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { FgRawModal } from './FgRawModal';
import { FgLightroomModal } from './FgLightroomModal';
import { formatAsCsv, formatAsTxtList, downloadBlobFile } from '../../services/lightroom';
import type { Project, StudioProfile } from '../../types';

interface FgProjectDetailProps {
  project: Project;
  studio: StudioProfile;
  onBack: () => void;
  onUpdateProject: (updated: Project) => void;
  onOpenClientView: (slug: string) => void;
  onDeleteProject: (id: string) => void;
}

export const FgProjectDetail: React.FC<FgProjectDetailProps> = ({
  project,
  studio: _studio,
  onBack,
  onUpdateProject,
  onOpenClientView,
  onDeleteProject,
}) => {
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [isLightroomModalOpen, setIsLightroomModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNames, setCopiedNames] = useState(false);
  const [copiedWaText, setCopiedWaText] = useState(false);

  const selectedPhotos = project.photos.filter((p) => project.selectedFileNames.includes(p.name));

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const clientUrl = `${origin}/?p=${project.slug}`;

  const getCasualWaText = () => {
    return `Haii kak ${project.clientName}! 🎉\nFoto-foto kamu udah siap nih~\n\nSilahkan Tandain foto favoritnya di sini yaa:\n${clientUrl}\n\nTinggal buka linknya, geser & tap ❤️ di foto yang kamu suka, terus kirim balik ke kita. Gampang banget langsung dari HP tanpa perlu download app! ✨\n\nKuota pilihan: *${project.quota} foto* yaa!`;
  };

  const handleCopyClientLink = () => {
    navigator.clipboard.writeText(clientUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyWaText = () => {
    navigator.clipboard.writeText(getCasualWaText());
    setCopiedWaText(true);
    setTimeout(() => setCopiedWaText(false), 2500);
  };

  const handleCopyRawFilenames = () => {
    navigator.clipboard.writeText(project.selectedFileNames.join('\n'));
    setCopiedNames(true);
    setTimeout(() => setCopiedNames(false), 2500);
  };

  const handleExportCsv = () => {
    const content = formatAsCsv(project.selectedFileNames, project.clientName);
    downloadBlobFile(content, `${project.clientName.replace(/\s+/g, '_')}_pilihan.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportTxt = () => {
    const content = formatAsTxtList(project.selectedFileNames);
    downloadBlobFile(content, `${project.clientName.replace(/\s+/g, '_')}_pilihan.txt`, 'text/plain;charset=utf-8;');
  };

  const handleToggleLock = () => {
    const nextLocked = !project.locked;
    const updated: Project = {
      ...project,
      locked: nextLocked,
      status: nextLocked ? 'udah_kirim' : 'lagi_milih',
      revisionRound: !nextLocked ? project.revisionRound + 1 : project.revisionRound,
    };
    onUpdateProject(updated);
  };

  const handleToggleWatermark = () => {
    const nextWm = !project.hasWatermark;
    const updated: Project = {
      ...project,
      hasWatermark: nextWm,
    };
    onUpdateProject(updated);
  };

  const handleExtendExpiry = () => {
    const current = new Date(project.expiresAt).getTime();
    const extended = new Date(Math.max(Date.now(), current) + 86400000 * 30).toISOString();
    onUpdateProject({ ...project, expiresAt: extended });
    alert('Masa aktif galeri berhasil diperpanjang 30 hari ke depan! 🎉');
  };

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(project.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Breadcrumb & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={onBack} className="pill-btn pill-btn-ghost" style={{ gap: '6px' }}>
          <ArrowLeft size={18} /> Kembali ke Daftar Project
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onOpenClientView(project.slug)}
            className="pill-btn pill-btn-primary"
            style={{ height: '38px', fontSize: '13px', gap: '6px' }}
          >
            <Eye size={15} /> 👁️ Preview Galeri Klien
          </button>
          <button
            onClick={() => {
              if (confirm('Yakin ingin menghapus project ini?')) {
                onDeleteProject(project.id);
                onBack();
              }
            }}
            className="pill-btn pill-btn-ghost"
            style={{ height: '38px', color: 'var(--heart)' }}
            title="Hapus project"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Project Header Card */}
      <div className="card-ios" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <StatusBadge status={project.status} />
              {project.pin && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={13} /> PIN: <b>{project.pin}</b>
                </span>
              )}
              {/* Watermark Toggle Badge */}
              <button
                type="button"
                onClick={handleToggleWatermark}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: project.hasWatermark ? '#E3F2FD' : 'var(--border-light)',
                  color: project.hasWatermark ? '#007AFF' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: 'none',
                }}
                title="Bebas ubah watermark: klik untuk nyalakan/matikan"
              >
                <ShieldCheck size={13} />
                {project.hasWatermark ? 'Watermark: ON' : 'Watermark: OFF'}
              </button>
              {daysLeft <= 5 && (
                <span style={{ fontSize: '12px', color: '#B25E00', fontWeight: 600 }}>
                  ⚠️ Habis dalam {daysLeft} hari
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              {project.clientName}
            </h1>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Progres pilihan: <b>{project.selectedFileNames.length}</b> dari kuota <b>{project.quota} foto</b>
            </p>
          </div>

          {/* Quick Copy Link & Direct Preview Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onOpenClientView(project.slug)}
              className="pill-btn pill-btn-secondary"
              style={{ height: '42px', fontSize: '13.5px', gap: '6px' }}
            >
              <Eye size={16} /> 👁️ Preview Klien
            </button>
            <button
              onClick={handleCopyClientLink}
              className={`pill-btn ${copiedLink ? 'pill-btn-heart' : 'pill-btn-secondary'}`}
              style={{ height: '42px', fontSize: '13.5px', gap: '6px' }}
              title="Salin URL link galeri klien saja"
            >
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              {copiedLink ? 'Link Tersalin!' : 'Salin Link'}
            </button>
            <button
              onClick={handleCopyWaText}
              className={`pill-btn ${copiedWaText ? 'pill-btn-heart' : 'pill-btn-primary'}`}
              style={{ height: '42px', fontSize: '13.5px', gap: '6px' }}
              title="Salin format chat WA santai siap kirim ke klien"
            >
              {copiedWaText ? <Check size={16} /> : <Copy size={16} />}
              {copiedWaText ? 'Pesan Tersalin!' : 'Salin Chat WA Santai 💬'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(getCasualWaText())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pill-btn"
              style={{
                height: '42px',
                fontSize: '13.5px',
                padding: '0 14px',
                gap: '6px',
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title="Buka WhatsApp langsung dengan teks santai terisi"
            >
              <MessageCircle size={16} /> Buka WA
            </a>
          </div>
        </div>

        {/* Action Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          {/* Main Action: Ambil RAW dari Laptop */}
          <button
            onClick={() => setIsRawModalOpen(true)}
            className="pill-btn"
            style={{
              height: '42px',
              backgroundColor: '#007AFF',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)',
            }}
          >
            <HardDrive size={16} /> Ambil RAW dari Laptop
          </button>

          {/* Salin untuk Lightroom */}
          <button
            onClick={() => setIsLightroomModalOpen(true)}
            className="pill-btn pill-btn-secondary"
            style={{ height: '42px' }}
          >
            <Sliders size={16} /> Salin untuk Lightroom
          </button>

          {/* Salin Nama File */}
          <button
            onClick={handleCopyRawFilenames}
            className="pill-btn pill-btn-secondary"
            style={{ height: '42px' }}
          >
            {copiedNames ? <Check size={16} /> : <Copy size={16} />}
            {copiedNames ? 'Tersalin!' : 'Salin Nama File'}
          </button>

          {/* Export CSV / TXT */}
          <button
            onClick={handleExportCsv}
            className="pill-btn pill-btn-secondary"
            style={{ height: '42px' }}
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>

          <button
            onClick={handleExportTxt}
            className="pill-btn pill-btn-secondary"
            style={{ height: '42px' }}
          >
            <FileText size={16} /> Export TXT
          </button>

          {/* Unlock / Lock Toggle */}
          <button
            onClick={handleToggleLock}
            className="pill-btn pill-btn-ghost"
            style={{ height: '42px' }}
          >
            {project.locked ? <Unlock size={16} /> : <Lock size={16} />}
            {project.locked ? 'Buka Kunci (Beri Revisi)' : 'Kunci Pilihan'}
          </button>

          {/* Watermark Toggle */}
          <button
            onClick={handleToggleWatermark}
            className="pill-btn pill-btn-ghost"
            style={{
              height: '42px',
              gap: '6px',
              color: project.hasWatermark ? '#007AFF' : 'var(--text-secondary)',
            }}
            title="Klik untuk menyalakan atau mematikan watermark pada preview foto klien"
          >
            <ShieldCheck size={16} />
            {project.hasWatermark ? 'Watermark: Aktif' : 'Watermark: Nonaktif'}
          </button>

          {/* Extend Expiry */}
          <button
            onClick={handleExtendExpiry}
            className="pill-btn pill-btn-ghost"
            style={{ height: '42px' }}
          >
            <RefreshCw size={16} /> Perpanjang 30 Hari
          </button>
        </div>
      </div>

      {/* Selected Photos Grid Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
            Daftar Foto yang Dipilih Klien ({selectedPhotos.length})
          </h3>
          <a
            href={project.driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '13px', color: '#007AFF', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Buka Folder Drive Asli <ExternalLink size={14} />
          </a>
        </div>

        {selectedPhotos.length === 0 ? (
          <div className="card-ios" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Klien belum memilih foto apapun.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              Bagikan link project ke WhatsApp klien agar mereka bisa mulai memilih.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            {selectedPhotos.map((photo, i) => (
              <div
                key={photo.id}
                className="card-ios"
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  padding: '8px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  style={{
                    width: '100%',
                    height: '140px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {photo.name}
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    #{i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RAW Matcher Modal */}
      <FgRawModal
        isOpen={isRawModalOpen}
        onClose={() => setIsRawModalOpen(false)}
        selectedFileNames={project.selectedFileNames}
        clientName={project.clientName}
      />

      {/* Lightroom Filter Modal */}
      <FgLightroomModal
        isOpen={isLightroomModalOpen}
        onClose={() => setIsLightroomModalOpen(false)}
        selectedFileNames={project.selectedFileNames}
      />
    </div>
  );
};
