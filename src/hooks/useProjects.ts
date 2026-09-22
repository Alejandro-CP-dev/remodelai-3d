import { useState, useEffect } from 'react';
import { Project, Scene, User } from '../types';
import { StorageService } from '../services/storage';

// Application-layer wrapper around project CRUD. Owns `projects`/`activeProjectId`;
// view navigation (which screen to show after an action) stays the caller's concern.
export function useProjects(currentUser: User | null) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const user = StorageService.getCurrentUser();
    return StorageService.getProjects(user?.id);
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const user = StorageService.getCurrentUser();
    const list = StorageService.getProjects(user?.id);
    return list.length > 0 ? list[0].id : null;
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const openProject = (projectId: string) => {
    setActiveProjectId(projectId);
  };

  const createProject = (
    name: string,
    dimensions?: { width: number; length: number; height: number },
    owner?: User | null
  ): Project => {
    // Accept an explicit owner so callers that just resolved/logged in a user
    // (e.g. the landing page demo CTA) don't fall back to a stale currentUser.
    const effectiveOwner = owner !== undefined ? owner : currentUser;
    const newProj = StorageService.createProject({
      name,
      ownerId: effectiveOwner?.id || 'anon',
      ownerName: effectiveOwner?.name || 'Anónimo',
      dimensions: dimensions || { width: 4.0, length: 3.0, height: 2.6 }
    });
    setProjects(StorageService.getProjects(effectiveOwner?.id));
    setActiveProjectId(newProj.id);
    return newProj;
  };

  const duplicateProject = (projectId: string): Project => {
    const duplicated = StorageService.duplicateProject(
      projectId,
      currentUser?.id || 'anon',
      currentUser?.name || 'Anónimo'
    );
    setProjects(StorageService.getProjects(currentUser?.id));
    setActiveProjectId(duplicated.id);
    return duplicated;
  };

  const deleteProject = (projectId: string): { wasActive: boolean } => {
    StorageService.deleteProject(projectId, currentUser?.id || 'anon');
    const remaining = StorageService.getProjects(currentUser?.id);
    setProjects(remaining);
    const wasActive = activeProjectId === projectId;
    if (wasActive) {
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
    return { wasActive };
  };

  const updateActiveProject = (updated: Project) => {
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  // Returns whether it actually applied the scene (mirrors the original App.tsx
  // handler, which silently no-ops if activeProjectId points at a project that's
  // no longer in `projects`).
  const applyGeneratedScene = (newScene: Scene): boolean => {
    if (activeProjectId) {
      const activeProject = projects.find(p => p.id === activeProjectId);
      if (!activeProject) return false;
      const updated = { ...activeProject, scene: newScene, updatedAt: new Date().toISOString() };
      StorageService.saveProject(updated);
      updateActiveProject(updated);
      return true;
    }

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
    return true;
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;

  return {
    projects,
    setProjects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    openProject,
    createProject,
    duplicateProject,
    deleteProject,
    updateActiveProject,
    applyGeneratedScene
  };
}
