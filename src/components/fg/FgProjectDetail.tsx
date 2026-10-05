import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  HardDrive,
  FileText,
  ExternalLink,
  Unlock,
  Lock,
  Share2,
  Trash2,
  Eye,
  ShieldCheck,
  ShieldAlert,
  MessageCircle,
  Download,
} from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { FgRawModal } from './FgRawModal';
import { formatAsTxtList, downloadBlobFile } from '../../services/exportList';
import { downloadPhotoHd } from '../../services/photoDownload';
import { fetchProjectFromCloud } from '../../services/supabase';
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNames, setCopiedNames] = useState(false);
  const [copiedWaText, setCopiedWaText] = useState(false);
  const [watermarkAnimating, setWatermarkAnimating] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const showActionToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => {
      setActionToast((current) => (current === msg ? null : current));
    }, 2800);
  };

  // Cross-device active polling heartbeat (real-time detection when client submits from smartphone)
  useEffect(() => {
    let isCancelled = false;
    const checkLiveUpdates = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      try {
        const remote = await fetchProjectFromCloud(project.slug);
        if (isCancelled || !remote) return;
        const statusChanged = remote.status !== project.status;
        const lockChanged = remote.locked !== project.locked;
        const watermarkChanged = remote.hasWatermark !== project.hasWatermark;
        const selectionChanged =
          remote.selectedFileNames.length !== project.selectedFileNames.length ||
          remote.selectedFileNames.some((name, idx) => name !== project.selectedFileNames[idx]);

        if (statusChanged || lockChanged || watermarkChanged || selectionChanged) {
          onUpdateProject({
            ...project,
            status: remote.status,
            locked: remote.locked,
            hasWatermark: remote.hasWatermark,
            selectedFileNames: remote.selectedFileNames,
            submissionHistory: remote.submissionHistory || project.submissionHistory,
            revisionRound: remote.revisionRound || project.revisionRound,
          });

          if (statusChanged && remote.status === 'udah_kirim') {
            showActionToast('🎉 Klien baru saja mengirimkan pilihan foto!');
          }
        }
      } catch {
        // ignore network error
      }
    };

    const interval = setInterval(checkLiveUpdates, 3200);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [project, onUpdateProject]);

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
    showActionToast(nextLocked ? '🔒 Galeri dikunci (pilihan tersimpan)' : '🔓 Galeri dibuka kembali (mode revisi)');
  };

  const handleToggleWatermark = () => {
    const nextWm = !project.hasWatermark;
    const updated: Project = {
      ...project,
      hasWatermark: nextWm,
    };
    setWatermarkAnimating(true);
    setTimeout(() => setWatermarkAnimating(false), 450);
    onUpdateProject(updated);
    showActionToast(nextWm ? '🛡️ Watermark diaktifkan di galeri klien' : '🛡️ Watermark dinonaktifkan (foto bersih)');
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
          <ArrowLeft size={16} /> Kembali ke Daftar Project
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onOpenClientView(project.slug)}
            className="pill-btn pill-btn-primary"
            style={{ height: '38px', fontSize: '13px', gap: '6px' }}
          >
            <Eye size={15} /> Preview Galeri Klien
          </button>
          <button
            onClick={() => {
              if (confirm('Yakin ingin menghapus project ini?')) {
                onDeleteProject(project.id);
                onBack();
              }
            }}
            className="pill-btn pill-btn-ghost"
            style={{
              height: '38px',
              width: '38px',
              padding: 0,
              color: 'var(--text-tertiary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--heart)';
              e.currentTarget.style.backgroundColor = 'var(--heart-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
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
                className={watermarkAnimating ? 'animate-watermark-flip' : ''}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  backgroundColor: project.hasWatermark ? 'rgba(0, 122, 255, 0.1)' : 'rgba(142, 142, 147, 0.1)',
                  color: project.hasWatermark ? '#007AFF' : '#636366',
                  border: project.hasWatermark ? '1px solid rgba(0, 122, 255, 0.3)' : '1px solid rgba(142, 142, 147, 0.22)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: project.hasWatermark ? '0 1px 4px rgba(0, 122, 255, 0.12)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                title="Bebas ubah watermark: klik untuk nyalakan/matikan di galeri klien secara realtime"
              >
                {project.hasWatermark ? (
                  <>
                    <ShieldCheck size={13} style={{ color: '#007AFF' }} />
                    <span>Watermark: ON</span>
                    <span className="status-dot-pulse" style={{ backgroundColor: '#007AFF' }} />
                  </>
                ) : (
                  <>
                    <ShieldAlert size={13} style={{ color: '#8E8E93' }} />
                    <span>Watermark: OFF</span>
                  </>
                )}
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
              style={{ height: '40px', fontSize: '13px', gap: '6px' }}
              title="Buka galeri versi klien"
            >
              <Eye size={15} /> Preview Klien
            </button>
            <button
              onClick={handleCopyClientLink}
              className={`pill-btn ${copiedLink ? 'pill-btn-heart' : 'pill-btn-secondary'}`}
              style={{ height: '40px', fontSize: '13px', gap: '6px' }}
              title="Salin URL link galeri klien saja"
            >
              {copiedLink ? <Check size={15} /> : <Share2 size={15} />}
              {copiedLink ? 'Link Tersalin!' : 'Salin Link'}
            </button>
            <button
              onClick={handleCopyWaText}
              className={`pill-btn ${copiedWaText ? 'pill-btn-heart' : 'pill-btn-primary'}`}
              style={{ height: '40px', fontSize: '13px', gap: '6px' }}
              title="Salin format chat WA santai siap kirim ke klien"
            >
              {copiedWaText ? <Check size={15} /> : <Copy size={15} />}
              {copiedWaText ? 'Pesan Tersalin!' : 'Salin Chat WA Santai'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(getCasualWaText())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pill-btn pill-btn-whatsapp"
              style={{ height: '40px', fontSize: '13px', padding: '0 15px', gap: '6px' }}
              title="Buka WhatsApp langsung dengan teks santai terisi"
            >
              <MessageCircle size={15} /> Buka WA
            </a>
          </div>
        </div>

        {/* Action Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          {/* Main Action: Ambil RAW dari Laptop */}
          <button
            onClick={() => setIsRawModalOpen(true)}
            className="pill-btn pill-btn-blue"
            style={{ height: '40px', fontSize: '13px' }}
          >
            <HardDrive size={15} /> Ambil RAW dari Laptop
          </button>

          {/* Salin Nama File */}
          <button
            onClick={handleCopyRawFilenames}
            className={`pill-btn ${copiedNames ? 'pill-btn-heart' : 'pill-btn-secondary'}`}
            style={{ height: '40px', fontSize: '13px' }}
          >
            {copiedNames ? <Check size={15} /> : <Copy size={15} />}
            {copiedNames ? 'Nama File Tersalin!' : 'Salin Nama File'}
          </button>

          {/* Export TXT (Export CSV removed per user request) */}
          <button
            onClick={handleExportTxt}
            className="pill-btn pill-btn-secondary"
            style={{ height: '40px', fontSize: '13px' }}
            title="Unduh daftar nama file format .txt"
          >
            <FileText size={15} /> Export TXT
          </button>

          {/* Subtle separator */}
          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-light)', margin: '0 2px' }} />

          {/* Unlock / Lock Toggle */}
          <button
            onClick={handleToggleLock}
            className={`pill-btn ${project.locked ? '' : 'pill-btn-ghost'}`}
            style={{
              height: '40px',
              fontSize: '13px',
              gap: '6px',
              backgroundColor: project.locked ? 'rgba(255, 149, 0, 0.12)' : undefined,
              borderColor: project.locked ? 'rgba(255, 149, 0, 0.35)' : undefined,
              color: project.locked ? '#D97706' : undefined,
              fontWeight: project.locked ? 700 : 500,
              boxShadow: project.locked ? '0 2px 8px rgba(255, 149, 0, 0.12)' : undefined,
            }}
            title={project.locked ? 'Klik untuk membuka kunci galeri agar klien dapat memilih atau merevisi kembali foto' : 'Kunci pilihan foto'}
          >
            {project.locked ? <Unlock size={15} /> : <Lock size={15} />}
            {project.locked ? 'Buka Kunci (Beri Revisi)' : 'Kunci Pilihan'}
          </button>

          {/* Watermark Toggle */}
          <button
            onClick={handleToggleWatermark}
            className={`pill-btn ${project.hasWatermark ? 'btn-blue' : 'pill-btn-ghost'} ${watermarkAnimating ? 'animate-watermark-flip' : ''}`}
            style={{
              height: '40px',
              fontSize: '13px',
              gap: '6px',
            }}
            title="Klik untuk menyalakan atau mematikan watermark pada preview foto klien secara realtime"
          >
            {project.hasWatermark ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
            {project.hasWatermark ? 'Watermark: Aktif' : 'Watermark: Nonaktif'}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={photo.name}>
                    {photo.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => downloadPhotoHd(photo)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--border-light)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="Unduh foto resolusi HD asli (Google Drive)"
                    >
                      <Download size={13} />
                    </button>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      #{i + 1}
                    </span>
                  </div>
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

      {/* Real-time Toast Feedback */}
      {actionToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(24px + env(safe-area-inset-bottom))',
            right: '20px',
            zIndex: 9999,
            backgroundColor: '#1D1D1F',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '14px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.28)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <span>{actionToast}</span>
        </div>
      )}
    </div>
  );
};
