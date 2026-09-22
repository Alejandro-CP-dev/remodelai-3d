import { Project, User } from '../../src/types';
import * as projectRepo from '../repositories/project.repository';
import { logAudit } from '../repositories/audit.repository';
import { HttpError } from '../utils/httpError';

function assertReadable(project: Project, user?: User) {
  if (user && user.role !== 'admin' && project.ownerId !== user.id) {
    throw new HttpError(403, 'No tienes permiso para ver este proyecto');
  }
}

function assertWritable(project: Project, user?: User, message = 'No tienes permiso para modificar este proyecto') {
  if (user && user.role !== 'admin' && project.ownerId !== user.id) {
    throw new HttpError(403, message);
  }
}

export async function listProjects(user: User | undefined, queryUserId?: string): Promise<Project[]> {
  const isAdmin = user?.role === 'admin';
  const userId = user?.id || queryUserId;
  return projectRepo.getProjects(userId, isAdmin);
}

export async function createProject(body: any, user: User | undefined): Promise<Project> {
  const ownerId = user?.id || body.ownerId || 'usr-default-02';
  const ownerName = user?.name || body.ownerName || 'Alejandro Carrillo';

  // If the client already assembled a full project locally (StorageService.createProject
  // builds its own id/scene before syncing), persist it as-is instead of generating a
  // second, different id — otherwise client and server would permanently disagree on the
  // project's identity and every future PUT would 404.
  if (body.id && body.scene) {
    const clientProject: Project = {
      id: body.id,
      name: body.name || 'Nuevo Espacio 3D',
      description: body.description || 'Espacio creado con RemodelAI 3D',
      ownerId,
      ownerName,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: body.status || 'active',
      version: body.version || 1,
      thumbnailUrl: body.thumbnailUrl,
      scene: body.scene
    };

    await projectRepo.saveProject(clientProject);
    await logAudit({
      userId: ownerId,
      userName: ownerName,
      action: 'project_create',
      entityType: 'project',
      entityId: clientProject.id,
      status: 'SUCCESS',
      metadata: { name: clientProject.name }
    });

    return clientProject;
  }

  const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const sceneId = `scn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const width = body.dimensions?.width || 4.2;
  const length = body.dimensions?.length || 3.4;
  const height = body.dimensions?.height || 2.6;

  const newProject: Project = {
    id: projectId,
    name: body.name || 'Nuevo Espacio 3D',
    description: 'Espacio creado con RemodelAI 3D',
    ownerId,
    ownerName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    version: 1,
    thumbnailUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&fit=crop&q=80',
    scene: {
      id: sceneId,
      projectId,
      version: 1,
      dimensions: { width, length, height },
      materials: {
        wallMaterial: 'pintura',
        wallColor: '#f1f5f9',
        floorMaterial: 'madera',
        floorColor: '#a16207',
        ceilingColor: '#ffffff',
        ceilingVisible: false
      },
      lightingPreset: 'dia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      objects: [
        {
          id: `obj-door-${Date.now()}`,
          sceneId,
          name: 'Puerta Principal de Paso',
          category: 'estructura',
          type: 'door',
          position: { x: 0, y: 1.05, z: -length / 2 + 0.05 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#57534e',
          material: 'madera',
          visible: true
        },
        {
          id: `obj-win-${Date.now()}`,
          sceneId,
          name: 'Ventanal con Vista',
          category: 'estructura',
          type: 'window',
          position: { x: width / 2 - 0.05, y: 1.35, z: 0 },
          rotation: { x: 0, y: -90, z: 0 },
          scale: { x: 1.2, y: 1.1, z: 1 },
          color: '#0284c7',
          material: 'cristal_aluminio',
          visible: true
        }
      ]
    }
  };

  await projectRepo.saveProject(newProject);
  await logAudit({
    userId: ownerId,
    userName: ownerName,
    action: 'project_create',
    entityType: 'project',
    entityId: newProject.id,
    status: 'SUCCESS',
    metadata: { name: newProject.name }
  });

  return newProject;
}

export async function getProjectById(id: string, user: User | undefined): Promise<Project> {
  const project = await projectRepo.getProjectById(id);
  if (!project) {
    throw new HttpError(404, 'Proyecto no encontrado');
  }
  assertReadable(project, user);
  return project;
}

export async function updateProject(id: string, body: any, user: User | undefined): Promise<Project> {
  const existing = await projectRepo.getProjectById(id);

  if (!existing) {
    // Upsert fallback: the client may be syncing a locally-created project whose
    // initial POST never reached the server (e.g. it was created while offline).
    // Accept it here instead of permanently 404ing on every future save.
    if (!body.scene) {
      throw new HttpError(404, 'Proyecto no encontrado');
    }
    const ownerId = user?.id || body.ownerId || 'usr-default-02';
    const ownerName = user?.name || body.ownerName || 'Alejandro Carrillo';
    const created: Project = {
      id,
      name: body.name || 'Nuevo Espacio 3D',
      description: body.description || 'Espacio creado con RemodelAI 3D',
      ownerId,
      ownerName,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: body.status || 'active',
      version: body.version || 1,
      thumbnailUrl: body.thumbnailUrl,
      scene: body.scene
    };
    await projectRepo.saveProject(created);
    return created;
  }

  assertWritable(existing, user);

  const updated: Project = {
    ...existing,
    ...body,
    id: existing.id,
    updatedAt: new Date().toISOString()
  };

  await projectRepo.saveProject(updated);
  return updated;
}

export async function deleteProject(id: string, user: User | undefined): Promise<{ success: boolean }> {
  const existing = await projectRepo.getProjectById(id);
  if (!existing) {
    throw new HttpError(404, 'Proyecto no encontrado');
  }
  assertWritable(existing, user, 'No tienes permiso para eliminar este proyecto');

  const success = await projectRepo.softDeleteProject(id);
  await logAudit({
    userId: user?.id || existing.ownerId,
    userName: user?.name || existing.ownerName,
    action: 'project_delete',
    entityType: 'project',
    entityId: existing.id,
    status: 'SUCCESS',
    metadata: { softDelete: true }
  });

  return { success };
}

export async function duplicateProject(id: string, user: User | undefined): Promise<Project> {
  const original = await projectRepo.getProjectById(id);
  if (!original) {
    throw new HttpError(404, 'Proyecto original no encontrado');
  }

  const targetUserId = user?.id || original.ownerId;
  const targetUserName = user?.name || original.ownerName;

  const newId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newSceneId = `scn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const duplicated: Project = {
    ...original,
    id: newId,
    name: `${original.name} (Copia)`,
    ownerId: targetUserId,
    ownerName: targetUserName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scene: {
      ...original.scene,
      id: newSceneId,
      projectId: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      objects: original.scene.objects.map(obj => ({
        ...obj,
        id: `obj-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sceneId: newSceneId
      }))
    }
  };

  await projectRepo.saveProject(duplicated);
  await logAudit({
    userId: targetUserId,
    userName: targetUserName,
    action: 'project_create',
    entityType: 'project',
    entityId: duplicated.id,
    status: 'SUCCESS',
    metadata: { duplicatedFrom: original.id }
  });

  return duplicated;
}
