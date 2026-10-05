import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { FgDashboard } from './components/fg/FgDashboard';
import { FgProjectDetail } from './components/fg/FgProjectDetail';
import { ClientGallery } from './components/client/ClientGallery';
import { FgNewProjectModal } from './components/fg/FgNewProjectModal';
import { FgAuthModal } from './components/fg/FgAuthModal';
import {
  getDeviceId,
  loadCachedProjects,
  saveCachedProjects,
  loadCachedStudio,
  saveCachedStudio,
  createDefaultStudio,
  studioFromProject,
  clearLegacyStorage,
  findLocalProjectBySlug,
} from './services/storage';
import {
  subscribeAuthChanges,
  signOutUser,
  saveProjectToCloud,
  deleteProjectFromCloud,
  fetchOwnerProjects,
  subscribeOwnerProjects,
  fetchStudioProfileFromCloud,
  saveStudioProfileToCloud,
  fetchProjectFromCloud,
  clientUpdateProjectInCloud,
  subscribeProjectFromCloud,
  DEMO_TESTING_ACCOUNT,
} from './services/supabase';
import { INITIAL_PROJECTS } from './services/sampleData';
import type { Project, StudioProfile, AuthUser } from './types';

type View = 'landing' | 'dashboard' | 'project_detail' | 'client';
type PostLoginAction = 'dashboard' | 'create';

const POST_LOGIN_KEY = 'tandain_post_login_action';

const upsertInList = (list: Project[], project: Project): Project[] => {
  const idx = list.findIndex((p) => p.id === project.id);
  if (idx === -1) return [project, ...list];
  const next = [...list];
  next[idx] = project;
  return next;
};

const getInitialClientSlug = (): string | null =>
  typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('p');

export function App() {
  // --- Auth (Google is the only photographer login) ---
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // --- Photographer data: ONLY the logged-in vendor's projects ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [studio, setStudio] = useState<StudioProfile>(() => createDefaultStudio());

  // --- Client gallery (opened via ?p=slug, no login) ---
  const [clientSlug] = useState<string | null>(getInitialClientSlug);
  const [clientProject, setClientProject] = useState<Project | null>(null);
  const [clientNotFound, setClientNotFound] = useState(false);

  // --- UI ---
  const [currentView, setCurrentView] = useState<View>(() => (getInitialClientSlug() ? 'client' : 'landing'));
  const [dashboardTab, setDashboardTab] = useState<'projects' | 'settings'>('projects');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [syncError, setSyncError] = useState('');

  const ownerId = user?.id;

  // 1. Auth subscription (fires immediately with the current session)
  useEffect(() => {
    clearLegacyStorage();
    return subscribeAuthChanges((authUser) => {
      setUser(authUser);
      setAuthReady(true);
    });
  }, []);

  // 2. Load this vendor's data whenever the logged-in account changes
  useEffect(() => {
    if (!ownerId) {
      setProjects([]);
      setStudio(createDefaultStudio());
      return;
    }

    const cached = loadCachedProjects(ownerId);
    if (cached.length === 0 && ownerId === DEMO_TESTING_ACCOUNT.id) {
      const seeded = INITIAL_PROJECTS.map((p) => ({
        ...p,
        ownerId,
        studioName: DEMO_TESTING_ACCOUNT.studioName,
        studioWhatsapp: DEMO_TESTING_ACCOUNT.whatsapp,
      }));
      setProjects(seeded);
      saveCachedProjects(ownerId, seeded);
    } else {
      setProjects(cached);
    }
    setStudio(loadCachedStudio(ownerId, user?.name));

    let cancelled = false;

    fetchOwnerProjects(ownerId).then((list) => {
      if (cancelled) return;
      if (list) {
        setProjects(list);
        saveCachedProjects(ownerId, list);
      } else {
        setSyncError('Gagal memuat galeri dari server. Periksa koneksi internet kamu.');
      }
    });

    fetchStudioProfileFromCloud(ownerId).then((profile) => {
      if (cancelled || !profile) return;
      setStudio((prev) => {
        const merged = { ...prev, ...profile };
        saveCachedStudio(ownerId, merged);
        return merged;
      });
    });

    const unsubscribe = subscribeOwnerProjects(ownerId, (event, payload) => {
      setProjects((prev) => {
        const next =
          event === 'DELETE' ? prev.filter((p) => p.id !== payload.id) : upsertInList(prev, payload as Project);
        saveCachedProjects(ownerId, next);
        return next;
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  // 3. Post-login routing (?view=fg after Google redirect, or a pending action)
  useEffect(() => {
    if (!authReady) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('p')) return;

    const pending = sessionStorage.getItem(POST_LOGIN_KEY) as PostLoginAction | null;
    const wantsDashboard = params.get('view') === 'fg' || pending !== null;

    if (wantsDashboard) {
      if (user) {
        sessionStorage.removeItem(POST_LOGIN_KEY);
        setDashboardTab('projects');
        setCurrentView('dashboard');
        if (pending === 'create') setIsCreateModalOpen(true);
      } else {
        setIsAuthModalOpen(true);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  // 4. Kick logged-out users out of photographer screens
  useEffect(() => {
    if (authReady && !user && (currentView === 'dashboard' || currentView === 'project_detail')) {
      setCurrentView('landing');
    }
  }, [authReady, user, currentView]);

  // 5. Client gallery: load project by slug from the cloud
  useEffect(() => {
    if (!clientSlug) return;
    let cancelled = false;

    fetchProjectFromCloud(clientSlug).then((proj) => {
      if (cancelled) return;
      const found = proj || findLocalProjectBySlug(clientSlug);
      if (!found) {
        setClientNotFound(true);
        return;
      }
      let opened = found;
      if (found.status === 'belum_dibuka' && !found.locked) {
        opened = { ...found, status: 'lagi_milih', lastOpenedAt: new Date().toISOString() };
        if (proj) {
          clientUpdateProjectInCloud(opened);
        }
      }
      setClientProject(opened);
    });

    return () => {
      cancelled = true;
    };
  }, [clientSlug]);

  // 6. Client gallery: live updates (e.g. photographer unlocks / changes quota)
  const clientProjectSlug = clientProject?.slug;
  useEffect(() => {
    if (!clientProjectSlug) return;
    return subscribeProjectFromCloud(clientProjectSlug, (updated) => setClientProject(updated));
  }, [clientProjectSlug]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const commitProjects = (next: Project[]) => {
    setProjects(next);
    if (ownerId) saveCachedProjects(ownerId, next);
  };

  const reportSync = (ok: boolean, action: string) => {
    if (!ok) setSyncError(`Gagal ${action} ke server. Perubahan belum tersimpan permanen.`);
  };

  /** Run an action only when logged in; otherwise open Google login and resume after redirect. */
  const requireLogin = (action: PostLoginAction, run: () => void) => {
    if (user) {
      run();
      return;
    }
    sessionStorage.setItem(POST_LOGIN_KEY, action);
    setIsAuthModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Photographer handlers
  // ---------------------------------------------------------------------------

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  const handleSelectProject = (project: Project) => {
    setActiveProjectId(project.id);
    setCurrentView('project_detail');
  };

  const handleCreateProject = (newProject: Project) => {
    if (!ownerId) return;
    const finalWa = newProject.studioWhatsapp || studio.whatsapp;
    const finalStudioName = newProject.studioName || studio.studioName;
    const stamped: Project = {
      ...newProject,
      ownerId,
      studioName: finalStudioName,
      studioWhatsapp: finalWa,
      waTemplate: newProject.waTemplate || studio.waTemplate,
    };
    commitProjects([stamped, ...projects]);
    setActiveProjectId(stamped.id);
    setCurrentView('project_detail');
    // Note: Do not force setIsCreateModalOpen(false) here so the user sees the Success Screen with Preview Button!
    saveProjectToCloud(stamped, ownerId).then((ok) => reportSync(ok, 'menyimpan galeri'));

    if ((finalWa && finalWa !== studio.whatsapp) || (finalStudioName && finalStudioName !== studio.studioName)) {
      handleUpdateStudio({
        ...studio,
        whatsapp: finalWa,
        studioName: finalStudioName,
      });
    }
  };

  const handleUpdateProject = (updated: Project) => {
    if (!ownerId) return;
    commitProjects(upsertInList(projects, updated));
    saveProjectToCloud(updated, ownerId).then((ok) => reportSync(ok, 'memperbarui galeri'));
  };

  const handleDeleteProject = (id: string) => {
    if (!ownerId) return;
    commitProjects(projects.filter((p) => p.id !== id));
    setActiveProjectId(null);
    setCurrentView('dashboard');
    deleteProjectFromCloud(id, ownerId).then((ok) => reportSync(ok, 'menghapus galeri'));
  };

  const handleUpdateStudio = (updated: StudioProfile) => {
    if (!ownerId) return;
    setStudio(updated);
    saveCachedStudio(ownerId, updated);
    // Keep the client-facing branding snapshot on every project in sync
    commitProjects(
      projects.map((p) => ({
        ...p,
        studioName: updated.studioName,
        studioWhatsapp: updated.whatsapp,
        waTemplate: updated.waTemplate,
      }))
    );
    saveStudioProfileToCloud(ownerId, updated).then((ok) => reportSync(ok, 'menyimpan profil studio'));
  };

  const handleLogout = async () => {
    await signOutUser();
    setUser(null);
    setActiveProjectId(null);
    setCurrentView('landing');
  };

  const handleOpenDashboard = () => {
    requireLogin('dashboard', () => {
      setDashboardTab('projects');
      setCurrentView('dashboard');
      window.history.pushState({}, '', window.location.pathname);
    });
  };

  const handleCreateGallery = () => {
    requireLogin('create', () => setIsCreateModalOpen(true));
  };

  const handleOpenLanding = () => {
    setCurrentView('landing');
    window.history.pushState({}, '', window.location.pathname);
  };

  /** Photographer previews their own gallery as the client sees it. */
  const handleOpenClientView = (slug: string) => {
    const match = projects.find((p) => p.slug === slug || p.id === slug);
    if (!match) return;
    setClientProject(match);
    setClientNotFound(false);
    setCurrentView('client');
    window.history.pushState({}, '', `${window.location.pathname}?p=${match.slug}`);
  };

  // ---------------------------------------------------------------------------
  // Client handlers (go through the restricted RPC — no login needed)
  // ---------------------------------------------------------------------------

  const applyClientUpdate = (updated: Project) => {
    setClientProject(updated);
    // If the owner is previewing their own gallery, reflect it in the dashboard too
    if (ownerId && updated.ownerId === ownerId) commitProjects(upsertInList(projects, updated));
    clientUpdateProjectInCloud(updated).then((ok) => reportSync(ok, 'menyimpan pilihan'));
  };

  const handleClientUpdateSelections = (fileNames: string[]) => {
    if (!clientProject) return;
    const deviceId = getDeviceId();
    applyClientUpdate({
      ...clientProject,
      selectedFileNames: fileNames,
      status: clientProject.status === 'belum_dibuka' ? 'lagi_milih' : clientProject.status,
      activeSelectorDeviceId: clientProject.activeSelectorDeviceId || deviceId,
    });
  };

  const handleClientSubmitFinal = () => {
    if (!clientProject) return;
    const now = new Date().toISOString();
    applyClientUpdate({
      ...clientProject,
      locked: true,
      status: 'udah_kirim',
      submittedAt: now,
      submissionHistory: [
        ...clientProject.submissionHistory,
        { round: clientProject.revisionRound, fileNames: clientProject.selectedFileNames, submittedAt: now },
      ],
    });
  };

  const handleClientTakeover = () => {
    if (!clientProject) return;
    applyClientUpdate({ ...clientProject, activeSelectorDeviceId: getDeviceId() });
  };

  const isOwnerPreview = !!(clientProject && ownerId && clientProject.ownerId === ownerId);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {currentView === 'landing' && (
        <LandingPage
          onCreateGallery={handleCreateGallery}
          onOpenDashboard={handleOpenDashboard}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          user={user}
        />
      )}

      {currentView === 'dashboard' && user && (
        <FgDashboard
          projects={projects}
          studio={studio}
          user={user}
          defaultTab={dashboardTab}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onUpdateStudio={handleUpdateStudio}
          onOpenClientView={handleOpenClientView}
          onOpenLanding={handleOpenLanding}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'project_detail' && user && activeProject && (
        <FgProjectDetail
          project={activeProject}
          studio={studio}
          onBack={handleOpenDashboard}
          onUpdateProject={handleUpdateProject}
          onOpenClientView={handleOpenClientView}
          onDeleteProject={handleDeleteProject}
        />
      )}

      {currentView === 'client' && clientProject && (
        <ClientGallery
          project={clientProject}
          studio={studioFromProject(clientProject)}
          onUpdateSelections={handleClientUpdateSelections}
          onSubmitFinal={handleClientSubmitFinal}
          onTakeover={handleClientTakeover}
          onBackToDashboard={isOwnerPreview ? handleOpenDashboard : undefined}
        />
      )}

      {currentView === 'client' && !clientProject && (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg)',
          }}
        >
          <span style={{ fontSize: '40px' }}>{clientNotFound ? '🔍' : '📸'}</span>
          <h1 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text)' }}>
            {clientNotFound ? 'Galeri tidak ditemukan' : 'Membuka galeri...'}
          </h1>
          {clientNotFound && (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: 1.5 }}>
              Link galeri mungkin salah atau sudah dihapus. Hubungi fotografer kamu untuk meminta link terbaru.
            </p>
          )}
        </div>
      )}

      <FgNewProjectModal
        isOpen={isCreateModalOpen && !!user}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleCreateProject}
        studio={studio}
      />

      <FgAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          sessionStorage.removeItem(POST_LOGIN_KEY);
        }}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setIsAuthModalOpen(false);
          const pending = sessionStorage.getItem(POST_LOGIN_KEY) as PostLoginAction | null;
          sessionStorage.removeItem(POST_LOGIN_KEY);
          setDashboardTab('projects');
          setCurrentView('dashboard');
          if (pending === 'create') {
            setIsCreateModalOpen(true);
          }
        }}
      />

      {syncError && (
        <div
          role="alert"
          onClick={() => setSyncError('')}
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '24px',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            maxWidth: 'calc(100% - 32px)',
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: '#1D1D1F',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            cursor: 'pointer',
          }}
        >
          ⚠️ {syncError} <span style={{ opacity: 0.6, marginLeft: '6px' }}>Tutup</span>
        </div>
      )}
    </div>
  );
}

export default App;
