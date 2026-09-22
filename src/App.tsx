import React, { useState, useEffect } from 'react';
import { User, Project, Scene } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { EditorPage } from './components/EditorPage';
import { SharedViewer } from './components/SharedViewer';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { TestMatrixModal } from './components/TestMatrixModal';
import { AIGeneratorModal } from './components/AIGeneratorModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'editor' | 'admin' | 'shared'>(() => {
    // Check if URL hash has a share token
    if (window.location.hash.includes('share=')) {
      return 'shared';
    }
    const user = StorageService.getCurrentUser();
    return user ? 'dashboard' : 'landing';
  });

  const [shareToken, setShareToken] = useState<string | null>(() => {
    const hash = window.location.hash;
    const match = hash.match(/share=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const user = StorageService.getCurrentUser();
    return StorageService.getProjects(user?.id);
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const user = StorageService.getCurrentUser();
    const list = StorageService.getProjects(user?.id);
    return list.length > 0 ? list[0].id : null;
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => StorageService.isNetworkOnline());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTestMatrixOpen, setIsTestMatrixOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

  // Sync projects when user changes
  useEffect(() => {
    if (currentUser) {
      const userProjects = StorageService.getProjects(currentUser.id);
      setProjects(userProjects);
      if (userProjects.length > 0 && !userProjects.some(p => p.id === activeProjectId)) {
        setActiveProjectId(userProjects[0].id);
      }
    } else {
      setProjects([]);
      setActiveProjectId(null);
    }
  }, [currentUser]);

  // Listen to hash changes (e.g. #share=xyz)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/share=([a-zA-Z0-9_-]+)/);
      if (match) {
        setShareToken(match[1]);
        setCurrentView('shared');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Offline / Online toggle simulation
  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    StorageService.setNetworkOnline(nextState);
  };

  // User Actions
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    const userProjects = StorageService.getProjects(user.id);
    setProjects(userProjects);
    if (userProjects.length > 0) {
      setActiveProjectId(userProjects[0].id);
    }
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleSwitchUser = (email: string) => {
    try {
      const user = StorageService.login(email);
      handleAuthSuccess(user);
    } catch (err: any) {
      alert(`No se pudo cambiar al usuario: ${err.message}`);
    }
  };

  // Project Actions
  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentView('editor');
  };

  const handleCreateNewProject = (
    name: string,
    dimensions?: { width: number; length: number; height: number },
    owner?: User | null
  ) => {
    // Accept an explicit owner so callers that just resolved/logged in a user
    // (e.g. the landing page demo CTA) don't fall back to the stale `currentUser`
    // closure value from before that login's state update is applied.
    const effectiveOwner = owner !== undefined ? owner : currentUser;
    const newProj = StorageService.createProject({
      name,
      ownerId: effectiveOwner?.id || 'anon',
      ownerName: effectiveOwner?.name || 'Anónimo',
      dimensions: dimensions || { width: 4.0, length: 3.0, height: 2.6 }
    });
    setProjects(StorageService.getProjects(effectiveOwner?.id));
    setActiveProjectId(newProj.id);
    setCurrentView('editor');
  };

  const handleDuplicateProject = (projectId: string) => {
    const duplicated = StorageService.duplicateProject(
      projectId,
      currentUser?.id || 'anon',
      currentUser?.name || 'Anónimo'
    );
    setProjects(StorageService.getProjects(currentUser?.id));
    setActiveProjectId(duplicated.id);
  };

  const handleDeleteProject = (projectId: string) => {
    StorageService.deleteProject(projectId, currentUser?.id || 'anon');
    const remaining = StorageService.getProjects(currentUser?.id);
    setProjects(remaining);
    if (activeProjectId === projectId) {
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
      setCurrentView('dashboard');
    }
  };

  const handleUpdateActiveProject = (updated: Project) => {
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const handleApplyAIGeneratedScene = (newScene: Scene) => {
    if (activeProjectId) {
      const activeProject = projects.find(p => p.id === activeProjectId);
      if (activeProject) {
        const updated = {
          ...activeProject,
          scene: newScene,
          updatedAt: new Date().toISOString()
        };
        StorageService.saveProject(updated);
        handleUpdateActiveProject(updated);
        setCurrentView('editor');
      }
    } else {
      // Create new project with the AI scene
      const newProj = StorageService.createProject({
        name: 'Habitación Generada con IA',
        ownerId: currentUser?.id || 'anon',
        ownerName: currentUser?.name || 'Anónimo',
        dimensions: newScene.dimensions
      });
      const updated = { ...newProj, scene: newScene };
      StorageService.saveProject(updated);
      setProjects(StorageService.getProjects(currentUser?.id));
      setActiveProjectId(updated.id);
      setCurrentView('editor');
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Global Navbar (Hidden in Shared View to maximize immersive 3D viewport) */}
      {currentView !== 'shared' && currentView !== 'editor' && (
        <Navbar
          currentUser={currentUser}
          currentView={currentView}
          hasActiveProject={!!activeProject}
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
          onNavigate={view => setCurrentView(view)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          onOpenTestMatrix={() => setIsTestMatrixOpen(true)}
          onSwitchUser={handleSwitchUser}
        />
      )}

      {/* Main View Router */}
      {currentView === 'landing' && (
        <LandingPage
          onOpenDemo={() => {
            // Pick or seed demo project. Resolve the effective user synchronously
            // here (rather than reading the `currentUser` state) since setCurrentUser
            // below hasn't been applied yet when the rest of this handler runs.
            let user = StorageService.getCurrentUser();
            if (!user) {
              user = StorageService.login('jalejandrocp29@gmail.com');
              setCurrentUser(user);
            }
            const projs = StorageService.getProjects(user.id);
            if (projs.length > 0) {
              setProjects(projs);
              setActiveProjectId(projs[0].id);
              setCurrentView('editor');
            } else {
              handleCreateNewProject('Dormitorio Principal Demo 3D', undefined, user);
            }
          }}
          onOpenRegister={() => setIsAuthOpen(true)}
          onOpenLogin={() => setIsAuthOpen(true)}
        />
      )}

      {currentView === 'dashboard' && (
        <Dashboard
          projects={projects}
          currentUser={currentUser}
          onOpenProject={handleOpenProject}
          onCreateNewProject={handleCreateNewProject}
          onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onShareProject={(id, name) => {
            setActiveProjectId(id);
            setCurrentView('editor');
          }}
        />
      )}

      {currentView === 'editor' && activeProject && (
        <EditorPage
          project={activeProject}
          currentUser={currentUser}
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
          onUpdateProject={handleUpdateActiveProject}
          onBackToDashboard={() => setCurrentView('dashboard')}
          onNavigateToShareView={token => {
            window.location.hash = `#share=${token}`;
            setShareToken(token);
            setCurrentView('shared');
          }}
        />
      )}

      {currentView === 'admin' && (
        <AdminDashboard
          currentUser={currentUser}
          onBackToApp={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'shared' && shareToken && (
        <SharedViewer
          token={shareToken}
          currentUser={currentUser}
          onCloneSuccess={cloned => {
            setProjects(StorageService.getProjects(currentUser?.id));
            setActiveProjectId(cloned.id);
            window.location.hash = '';
            setCurrentView('editor');
          }}
          onBackToHome={() => {
            window.location.hash = '';
            setCurrentView(currentUser ? 'dashboard' : 'landing');
          }}
          onRequireAuth={() => setIsAuthOpen(true)}
        />
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <TestMatrixModal
        isOpen={isTestMatrixOpen}
        onClose={() => setIsTestMatrixOpen(false)}
      />

      <AIGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        projectId={activeProjectId || 'new'}
        userId={currentUser?.id || 'anon'}
        onApplyGeneratedScene={handleApplyAIGeneratedScene}
      />
    </div>
  );
}
