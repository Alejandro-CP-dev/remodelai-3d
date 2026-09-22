import { ShareLink, User } from '../../src/types';
import * as shareRepo from '../repositories/share.repository';
import * as projectRepo from '../repositories/project.repository';
import { logAudit } from '../repositories/audit.repository';
import { HttpError } from '../utils/httpError';

export async function createShare(projectId: string, user: User | undefined): Promise<ShareLink> {
  const proj = await projectRepo.getProjectById(projectId);
  if (!proj) {
    throw new HttpError(404, 'Proyecto no encontrado');
  }

  const creatorId = user?.id || proj.ownerId;
  const creatorName = user?.name || proj.ownerName;

  const token = `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const share: ShareLink = {
    id: `shr-${Date.now()}`,
    projectId: proj.id,
    projectName: proj.name,
    createdBy: creatorId,
    creatorName,
    token,
    tokenHash: `hash-${token}`,
    isActive: true,
    accessCount: 0,
    createdAt: new Date().toISOString()
  };

  await shareRepo.saveShare(share);
  await logAudit({
    userId: creatorId,
    userName: creatorName,
    action: 'share_create',
    entityType: 'share',
    entityId: share.id,
    status: 'SUCCESS',
    metadata: { token }
  });

  return share;
}

export async function resolveShare(token: string) {
  const share = await shareRepo.getShareByToken(token);
  if (!share || !share.isActive) {
    throw new HttpError(404, 'Enlace revocado o no disponible');
  }

  const project = await projectRepo.getProjectById(share.projectId);
  if (!project) {
    throw new HttpError(404, 'El proyecto compartido ya no existe');
  }

  await shareRepo.incrementShareVisits(token);

  return {
    share,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerName: share.creatorName || project.ownerName,
      scene: project.scene,
      thumbnailUrl: project.thumbnailUrl
    }
  };
}

export async function revokeShare(token: string, user: User | undefined) {
  const share = await shareRepo.getShareByToken(token);
  if (!share) {
    throw new HttpError(404, 'Enlace no encontrado');
  }

  share.isActive = false;
  share.revokedAt = new Date().toISOString();
  await shareRepo.saveShare(share);

  await logAudit({
    userId: user?.id || share.createdBy,
    userName: user?.name || share.creatorName,
    action: 'share_revoke',
    entityType: 'share',
    entityId: share.id,
    status: 'SUCCESS',
    metadata: { token }
  });

  return { success: true, message: 'Enlace revocado exitosamente' };
}
