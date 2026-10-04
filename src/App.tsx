import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { FgDashboard } from './components/fg/FgDashboard';
import { FgProjectDetail } from './components/fg/FgProjectDetail';
import { ClientGallery } from './components/client/ClientGallery';
import { FgNewProjectModal } from './components/fg/FgNewProjectModal';
import { FgAuthModal } from './components/fg/FgAuthModal';
import {
  loadProjects,
  saveProjects,
  updateProject,
  loadStudioProfile,
  saveStudioProfile,
  subscribeRealtime,
  broadcastEvent,
  getDeviceId,
} from './services/storage';
import {
  getCurrentAuthUser,
  subscribeAuthChanges,
  signOutUser,
  saveProjectToCloud,
  fetchProjectFromCloud,
  subscribeProjectFromCloud,
} from './services/supabase';
import type { Project, StudioProfile, AuthUser } from './types';

export function App() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [studio, setStudio] = useState<StudioProfile>(() => loadStudioProfile());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'project_detail' | 'client'>('landing');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sync projects and subscribe to cross-tab & auth updates
  useEffect(() => {
    // 1. Check existing logged-in Google user
    getCurrentAuthUser().then((authUser) => {
      if (authUser) setUser(authUser);
    });

    const unsubscribeAuth = subscribeAuthChanges((authUser) => {
      setUser(authUser);
    });

    // 2. Check URL query parameters for ?p=slug (client view) or ?view=fg
    const params = new URLSearchParams(window.location.search);
    const clientSlug = params.get('p');
    const viewParam = params.get('view');

    if (clientSlug) {
      const match = projects.find((p) => p.slug === clientSlug || p.id === clientSlug);
      if (match) {
        setActiveProjectId(match.id);
        setCurrentView('client');

        // Mark as opened if not already
        if (match.status === 'belum_dibuka') {
          const updated: Project = {
            ...match,
            status: 'lagi_milih',
            lastOpenedAt: new Date().toISOString(),
          };
          updateProject(updated);
          setProjects(loadProjects());
          saveProjectToCloud(updated);
          broadcastEvent({
            type: 'SELECTION_CHANGE',
            projectId: match.id,
            selectedFileNames: match.selectedFileNames,
            deviceId: getDeviceId(),
          });
        }
      } else {
        // Not in local storage, attempt to fetch from Supabase Cloud
        fetchProjectFromCloud(clientSlug).then((cloudProj) => {
          if (cloudProj) {
            const updated = [cloudProj, ...loadProjects()];
            setProjects(updated);
            saveProjects(updated);
            setActiveProjectId(cloudProj.id);
            setCurrentView('client');

            if (cloudProj.status === 'belum_dibuka') {
              const openedProj: Project = {
                ...cloudProj,
                status: 'lagi_milih',
                lastOpenedAt: new Date().toISOString(),
              };
              updateProject(openedProj);
              saveProjectToCloud(openedProj);
            }
          }
        });
      }
    } else if (viewParam === 'fg') {
      setCurrentView('dashboard');
    }

    const unsubscribeStorage = subscribeRealtime((_event) => {
      // Reload projects from storage to get the fresh state
      setProjects(loadProjects());
    });

    return () => {
      unsubscribeAuth();
      unsubscribeStorage();
    };
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // Real-time Cloud subscription for active project if in client or project_detail view
  useEffect(() => {
    if (!activeProject?.slug) return;
    const unsubscribeCloud = subscribeProjectFromCloud(activeProject.slug, (cloudUpdated) => {
      updateProject(cloudUpdated);
      setProjects(loadProjects());
    });
    return () => {
      unsubscribeCloud();
    };
  }, [activeProject?.slug]);

  // Handlers for Photographer actions
  const handleSelectProject = (project: Project) => {
    setActiveProjectId(project.id);
    setCurrentView('project_detail');
  };

  const handleCreateProject = (newProject: Project) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    saveProjects(updated);
    setActiveProjectId(newProject.id);
    setCurrentView('project_detail');
    saveProjectToCloud(newProject);
  };

  const handleUpdateProject = (updated: Project) => {
    updateProject(updated);
    setProjects(loadProjects());
    saveProjectToCloud(updated);
    broadcastEvent({
      type: 'PROJECT_LOCKED_CHANGE',
      projectId: updated.id,
      locked: updated.locked,
    });
  };

  const handleDeleteProject = (id: string) => {
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    saveProjects(remaining);
    setActiveProjectId(null);
    setCurrentView('dashboard');
  };

  const handleUpdateStudio = (updated: StudioProfile) => {
    setStudio(updated);
    saveStudioProfile(updated);
  };

  const handleLogout = async () => {
    await signOutUser();
    setUser(null);
  };

  // Handlers for Client actions
  const handleClientUpdateSelections = (fileNames: string[]) => {
    if (!activeProject) return;
    const deviceId = getDeviceId();
    const updated: Project = {
      ...activeProject,
      selectedFileNames: fileNames,
      status: activeProject.status === 'belum_dibuka' ? 'lagi_milih' : activeProject.status,
      activeSelectorDeviceId: activeProject.activeSelectorDeviceId || deviceId,
    };
    updateProject(updated);
    setProjects(loadProjects());
    saveProjectToCloud(updated);
    broadcastEvent({
      type: 'SELECTION_CHANGE',
      projectId: activeProject.id,
      selectedFileNames: fileNames,
      deviceId,
    });
  };

  const handleClientSubmitFinal = () => {
    if (!activeProject) return;
    const updated: Project = {
      ...activeProject,
      locked: true,
      status: 'udah_kirim',
      submittedAt: new Date().toISOString(),
      submissionHistory: [
        ...activeProject.submissionHistory,
        {
          round: activeProject.revisionRound,
          fileNames: activeProject.selectedFileNames,
          submittedAt: new Date().toISOString(),
        },
      ],
    };
    updateProject(updated);
    setProjects(loadProjects());
    saveProjectToCloud(updated);
    broadcastEvent({
      type: 'PROJECT_SUBMITTED',
      projectId: activeProject.id,
      selectedFileNames: activeProject.selectedFileNames,
    });
  };

  const handleClientTakeover = () => {
    if (!activeProject) return;
    const deviceId = getDeviceId();
    const updated: Project = {
      ...activeProject,
      activeSelectorDeviceId: deviceId,
    };
    updateProject(updated);
    setProjects(loadProjects());
    saveProjectToCloud(updated);
    broadcastEvent({
      type: 'SELECTOR_TAKEOVER',
      projectId: activeProject.id,
      newDeviceId: deviceId,
    });
  };

  const handleOpenClientView = (slug: string) => {
    const match = projects.find((p) => p.slug === slug || p.id === slug);
    if (match) {
      setActiveProjectId(match.id);
      setCurrentView('client');
      // Update browser history so URL can be copied/reloaded
      const newUrl = `${window.location.pathname}?p=${match.slug}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  const handleOpenDashboard = () => {
    setCurrentView('dashboard');
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleOpenLanding = () => {
    setCurrentView('landing');
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleProjectCreatedFromLanding = (newProject: Project) => {
    handleCreateProject(newProject);
    setActiveProjectId(newProject.id);
    setCurrentView('project_detail');
    setIsCreateModalOpen(false);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Render Current View */}
      {currentView === 'landing' && (
        <LandingPage
          onCreateGallery={() => setIsCreateModalOpen(true)}
          onOpenDashboard={handleOpenDashboard}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          user={user}
        />
      )}

      {currentView === 'dashboard' && (
        <FgDashboard
          projects={projects}
          studio={studio}
          user={user}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onUpdateStudio={handleUpdateStudio}
          onOpenClientView={handleOpenClientView}
          onOpenLanding={handleOpenLanding}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'project_detail' && activeProject && (
        <FgProjectDetail
          project={activeProject}
          studio={studio}
          onBack={handleOpenDashboard}
          onUpdateProject={handleUpdateProject}
          onOpenClientView={handleOpenClientView}
          onDeleteProject={handleDeleteProject}
        />
      )}

      {currentView === 'client' && activeProject && (
        <ClientGallery
          project={activeProject}
          studio={studio}
          onUpdateSelections={handleClientUpdateSelections}
          onSubmitFinal={handleClientSubmitFinal}
          onTakeover={handleClientTakeover}
          onBackToDashboard={handleOpenDashboard}
        />
      )}

      {/* Global Quick Create Modal */}
      <FgNewProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreatedFromLanding}
        studio={studio}
      />

      {/* Photographer Google Login Modal */}
      <FgAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onContinueAsGuest={() => setIsAuthModalOpen(false)}
        studio={studio}
      />
    </div>
  );
}

export default App;
