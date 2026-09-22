import { Project, ShareLink } from '../types';
import { StorageService } from '../services/storage';
import { apiClient } from '../services/apiClient';

// Application-layer wrapper for share-link creation/revocation (owner side,
// used by ShareModal) and resolving/cloning a shared project (visitor side,
// used by SharedViewer).
export function useShareLink() {
  const getOrCreateActiveShare = (projectId: string, projectName: string, userId: string, userName: string): ShareLink => {
    const existing = StorageService.getShareLinks().find(s => s.projectId === projectId && s.isActive);
    if (existing) return existing;
    return StorageService.createShareLink(projectId, projectName, userId, userName);
  };

  const createShare = (projectId: string, projectName: string, userId: string, userName: string): ShareLink => {
    return StorageService.createShareLink(projectId, projectName, userId, userName);
  };

  const revokeShare = (shareId: string): void => {
    StorageService.revokeShareLink(shareId);
  };

  // Tries the server API first (enables cross-device sharing), falling back to
  // local storage if offline or during local testing.
  const resolveShare = async (token: string): Promise<{ project: Project; creatorName: string } | null> => {
    try {
      const res = await apiClient.getShareByToken(token);
      if (!res || !res.project) return null;
      return { project: res.project, creatorName: res.share.creatorName || res.project.ownerName };
    } catch {
      const share = StorageService.getShareLinkByToken(token);
      if (!share || !share.isActive) return null;
      StorageService.logShareAccess(token);
      const proj = StorageService.getProjectById(share.projectId);
      if (!proj) return null;
      return { project: proj, creatorName: share.creatorName || proj.ownerName };
    }
  };

  const cloneSharedProject = async (projectId: string, userId: string, userName: string): Promise<Project> => {
    try {
      return await apiClient.duplicateProject(projectId);
    } catch {
      return StorageService.duplicateProject(projectId, userId, userName);
    }
  };

  return { getOrCreateActiveShare, createShare, revokeShare, resolveShare, cloneSharedProject };
}
