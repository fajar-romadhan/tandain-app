import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Share2,
  Check,
  ChevronRight,
  FolderKanban,
  Sliders,
  Eye,
  LogIn,
  LogOut,
  MessageCircle,
  BookOpen,
  Sparkles,
  X,
} from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { FgNewProjectModal } from './FgNewProjectModal';
import { FgStudioSettings } from './FgStudioSettings';
import { FgGuideModal } from './FgGuideModal';
import type { Project, StudioProfile, AuthUser } from '../../types';

interface FgDashboardProps {
  projects: Project[];
  studio: StudioProfile;
  user?: AuthUser | null;
  defaultTab?: 'projects' | 'settings';
  onSelectProject: (project: Project) => void;
  onCreateProject: (newProject: Project) => void;
  onUpdateStudio: (updated: StudioProfile) => void;
  onOpenClientView: (slug: string) => void;
  onOpenLanding?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export const FgDashboard: React.FC<FgDashboardProps> = ({
  projects,
  studio,
  user,
  defaultTab,
  onSelectProject,
  onCreateProject,
  onUpdateStudio,
  onOpenClientView,
  onOpenLanding,
  onOpenLogin,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'settings'>(defaultTab || 'projects');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [showGuideBanner, setShowGuideBanner] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tandain_dismiss_guide_banner') !== 'true';
    } catch {
      return true;
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDismissGuideBanner = () => {
    setShowGuideBanner(false);
    try {
      localStorage.setItem('tandain_dismiss_guide_banner', 'true');
    } catch {
      // ignore
    }
  };

  // Sync tab if defaultTab changes externally
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const filteredProjects = projects.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return p.clientName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCopyLink = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/?p=${p.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: '80px' }}>
      {/* Top Navbar */}
      <header
        className="safe-top"
        style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border-light)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Logo / Studio Name */}
          <div
            onClick={onOpenLanding}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: onOpenLanding ? 'pointer' : 'default',
            }}
            title="Kembali ke Beranda"
          >
            <span style={{ fontSize: '24px' }}>📸</span>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                Tandain
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {studio.studioName}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('projects')}
              className={`pill-btn ${activeTab === 'projects' ? 'pill-btn-primary' : 'pill-btn-ghost'}`}
              style={{ height: '38px', fontSize: '13px', gap: '6px' }}
            >
              <FolderKanban size={16} /> Project ({projects.length})
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`pill-btn ${activeTab === 'settings' ? 'pill-btn-primary' : 'pill-btn-ghost'}`}
              style={{ height: '38px', fontSize: '13px', gap: '6px' }}
            >
              <Sliders size={16} /> Pengaturan
            </button>

            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="pill-btn pill-btn-ghost"
              style={{
                height: '38px',
                fontSize: '13px',
                gap: '6px',
                border: '1px solid rgba(0, 122, 255, 0.28)',
                backgroundColor: 'rgba(0, 122, 255, 0.06)',
                color: 'var(--accent)',
                fontWeight: 600,
              }}
              title="Buka panduan singkat & tutorial alur kerja sampai download RAW"
            >
              <BookOpen size={16} /> Panduan & Tutorial
            </button>

            {user ? (
              <button
                onClick={onLogout}
                className="pill-btn pill-btn-ghost"
                style={{ height: '38px', fontSize: '12.5px', gap: '5px', color: 'var(--text-secondary)' }}
                title={`Keluar (${user.email || user.name})`}
              >
                <LogOut size={15} /> Keluar
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="pill-btn pill-btn-ghost"
                style={{ height: '38px', fontSize: '12.5px', gap: '5px' }}
              >
                <LogIn size={15} /> Masuk Google
              </button>
            )}

            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="pill-btn pill-btn-heart"
              style={{ height: '38px', fontSize: '13px', gap: '6px' }}
            >
              <Plus size={16} /> Project Baru
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Quick-Start Workflow Banner */}
        {showGuideBanner && (
          <div
            style={{
              marginBottom: '20px',
              padding: '14px 18px',
              borderRadius: '16px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  backgroundColor: 'rgba(0, 122, 255, 0.08)',
                  border: '1px solid rgba(0, 122, 255, 0.18)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                    Alur Kerja Fotografer
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(0, 122, 255, 0.08)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(0, 122, 255, 0.18)',
                      letterSpacing: '0.2px',
                    }}
                  >
                    Workflow 5 Menit
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Siapkan Drive ➔ Buat Proyek ➔ Klien Pilih di HP ➔ Ambil RAW Otomatis di Laptop!
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setIsGuideModalOpen(true)}
                className="pill-btn pill-btn-primary"
                style={{
                  height: '36px',
                  fontSize: '12.5px',
                  padding: '0 14px',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
              >
                <BookOpen size={14} /> Pelajari Panduan Lengkap
              </button>
              <button
                onClick={handleDismissGuideBanner}
                className="pill-btn pill-btn-ghost"
                style={{
                  width: '30px',
                  height: '30px',
                  padding: 0,
                  borderRadius: '50%',
                  color: 'var(--text-tertiary)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
                title="Sembunyikan panduan cepat ini"
                aria-label="Sembunyikan panduan cepat ini"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}
        {activeTab === 'settings' ? (
          <FgStudioSettings
            studio={studio}
            onSave={(updated) => {
              onUpdateStudio(updated);
              setActiveTab('projects');
              setToastMessage('Pengaturan studio berhasil disimpan! ✨');
              setTimeout(() => setToastMessage(null), 3000);
            }}
            onBack={() => setActiveTab('projects')}
          />
        ) : (
          <div>
            {/* Search & Filter Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '360px' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama client atau sesi..."
                  style={{
                    width: '100%',
                    height: '42px',
                    paddingLeft: '38px',
                    paddingRight: '14px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    outline: 'none',
                    fontSize: '16px',
                  }}
                />
              </div>

              {/* Status Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'belum_dibuka', label: 'Belum dibuka' },
                  { id: 'lagi_milih', label: 'Lagi milih' },
                  { id: 'udah_kirim', label: 'Udah kirim' },
                  { id: 'selesai', label: 'Selesai' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: filterStatus === tab.id ? 600 : 500,
                      backgroundColor: filterStatus === tab.id ? 'var(--text)' : 'var(--surface)',
                      color: filterStatus === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project List */}
            {filteredProjects.length === 0 ? (
              <div className="card-ios" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Belum ada project di kategori ini.
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
                  Buat project pertamamu dan bagikan link galeri ke klien dalam hitungan detik!
                </p>
                <button
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="pill-btn pill-btn-primary"
                >
                  <Plus size={16} /> Buat Project Baru
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredProjects.map((project) => {
                  const coverPhoto = project.photos[0];
                  const progressPercent = Math.min(100, (project.selectedFileNames.length / project.quota) * 100);

                  return (
                    <div
                      key={project.id}
                      onClick={() => onSelectProject(project)}
                      className="card-ios"
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Left: Thumbnail & Title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
                        {coverPhoto ? (
                          <img
                            src={coverPhoto.url}
                            alt=""
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '12px',
                              backgroundColor: 'var(--surface-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                            }}
                          >
                            📁
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                              {project.clientName}
                            </h3>
                            <StatusBadge status={project.status} />
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {project.photos.length} total foto di Drive
                          </p>
                        </div>
                      </div>

                      {/* Middle: Selection Progress Bar */}
                      <div style={{ flex: '1 1 200px', maxWidth: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                            {project.selectedFileNames.length}/{project.quota} foto dipilih
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '5px',
                            borderRadius: '9999px',
                            backgroundColor: 'var(--border-light)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${progressPercent}%`,
                              height: '100%',
                              backgroundColor: project.status === 'udah_kirim' || project.status === 'selesai' ? 'var(--status-green-text)' : 'var(--heart)',
                              transition: 'width 0.25s ease',
                            }}
                          />
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={(e) => handleCopyLink(project, e)}
                          className={`pill-btn ${copiedId === project.id ? 'pill-btn-heart' : 'pill-btn-secondary'}`}
                          style={{ height: '36px', fontSize: '13px', padding: '0 14px' }}
                          title="Salin link galeri klien"
                        >
                          {copiedId === project.id ? <Check size={14} /> : <Share2 size={14} />}
                          {copiedId === project.id ? 'Tersalin' : 'Salin Link'}
                        </button>

                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `Haii kak ${project.clientName}! 🎉\nFoto-foto kamu udah siap nih~\n\nSilahkan Tandain foto favoritnya di sini yaa:\n${typeof window !== 'undefined' ? window.location.origin : ''}/?p=${project.slug}\n\nTinggal buka linknya, geser & tap ❤️ di foto yang kamu suka, terus kirim balik ke kita. Gampang banget langsung dari HP tanpa perlu download app! ✨\n\nKuota pilihan: *${project.quota} foto* yaa!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="pill-btn pill-btn-whatsapp"
                          style={{ height: '36px', width: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Buka WhatsApp dengan teks santai terisi"
                        >
                          <MessageCircle size={15} />
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenClientView(project.slug);
                          }}
                          className="pill-btn pill-btn-secondary"
                          style={{ height: '36px', width: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Preview galeri klien"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(project);
                          }}
                          className="pill-btn pill-btn-ghost"
                          style={{
                            height: '36px',
                            width: '36px',
                            padding: 0,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text)',
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title="Buka detail project"
                          aria-label="Buka detail project"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      <FgNewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={onCreateProject}
        studio={studio}
      />

      {/* Workflow & Dashboard Guide Modal */}
      <FgGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(24px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--text)',
            color: '#FFFFFF',
            padding: '10px 22px',
            borderRadius: '9999px',
            fontSize: '13.5px',
            fontWeight: 600,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            pointerEvents: 'none',
          }}
        >
          <Check size={16} style={{ color: '#34C759' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
