import React, { useState, useEffect } from 'react';
import { Scene } from './types';
import { StorageService } from './services/storage';
import { useAuth } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';
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
  const { currentUser, setCurrentUser, login, logout } = useAuth();
  const { projects, setProjects, activeProjectId, setActiveProjectId, activeProject, openProject, createProject, duplicateProject, deleteProject, updateActiveProject, applyGeneratedScene } =
    useProjects(currentUser);

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

  const [isOnline, setIsOnline] = useState<boolean>(() => StorageService.isNetworkOnline());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTestMatrixOpen, setIsTestMatrixOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

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

  // Auth Actions
  const handleAuthSuccess = (user: NonNullable<typeof currentUser>) => {
    setCurrentUser(user);
    const userProjects = StorageService.getProjects(user.id);
    setProjects(userProjects);
    if (userProjects.length > 0) {
      setActiveProjectId(userProjects[0].id);
    }
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentView('landing');
  };

  const handleSwitchUser = (email: string) => {
    try {
      const user = login(email);
      handleAuthSuccess(user);
    } catch (err: any) {
      alert(`No se pudo cambiar al usuario: ${err.message}`);
    }
  };

  // Project Actions
  const handleOpenProject = (projectId: string) => {
    openProject(projectId);
    setCurrentView('editor');
  };

  const handleCreateNewProject = (name: string, dimensions?: { width: number; length: number; height: number }) => {
    createProject(name, dimensions);
    setCurrentView('editor');
  };

  const handleDeleteProject = (projectId: string) => {
    const { wasActive } = deleteProject(projectId);
    if (wasActive) {
      setCurrentView('dashboard');
    }
  };

  const handleApplyAIGeneratedScene = (newScene: Scene) => {
    if (applyGeneratedScene(newScene)) {
      setCurrentView('editor');
    }
  };

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
              user = login('jalejandrocp29@gmail.com');
            }
            const projs = StorageService.getProjects(user.id);
            if (projs.length > 0) {
              setProjects(projs);
              setActiveProjectId(projs[0].id);
              setCurrentView('editor');
            } else {
              createProject('Dormitorio Principal Demo 3D', undefined, user);
              setCurrentView('editor');
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
          onDuplicateProject={duplicateProject}
          onDeleteProject={handleDeleteProject}
          onShareProject={id => {
            openProject(id);
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
          onUpdateProject={updateActiveProject}
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
