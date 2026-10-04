import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { FgDashboard } from './components/fg/FgDashboard';
import { FgProjectDetail } from './components/fg/FgProjectDetail';
import { ClientGallery } from './components/client/ClientGallery';
import { FgNewProjectModal } from './components/fg/FgNewProjectModal';
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
import type { Project, StudioProfile } from './types';

export function App() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [studio, setStudio] = useState<StudioProfile>(() => loadStudioProfile());
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'project_detail' | 'client'>('landing');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sync projects and subscribe to cross-tab real-time updates
  useEffect(() => {
    // Check URL query parameters for ?p=slug (client view) or ?view=fg
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
          broadcastEvent({
            type: 'SELECTION_CHANGE',
            projectId: match.id,
            selectedFileNames: match.selectedFileNames,
            deviceId: getDeviceId(),
          });
        }
      }
    } else if (viewParam === 'fg') {
      setCurrentView('dashboard');
    }

    const unsubscribe = subscribeRealtime((_event) => {
      // Reload projects from storage to get the fresh state
      setProjects(loadProjects());
    });

    return () => unsubscribe();
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

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
  };

  const handleUpdateProject = (updated: Project) => {
    updateProject(updated);
    setProjects(loadProjects());
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
        />
      )}

      {currentView === 'dashboard' && (
        <FgDashboard
          projects={projects}
          studio={studio}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onUpdateStudio={handleUpdateStudio}
          onOpenClientView={handleOpenClientView}
          onOpenLanding={handleOpenLanding}
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
      />
    </div>
  );
}

export default App;
