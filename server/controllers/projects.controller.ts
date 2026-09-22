import { Response } from 'express';
import * as projectService from '../services/project.service';
import { sendError } from '../utils/httpError';
import { AuthenticatedRequest } from '../types';

export async function list(req: AuthenticatedRequest, res: Response) {
  const projects = await projectService.listProjects(req.user, req.query.userId as string);
  res.json(projects);
}

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await projectService.createProject(req.body, req.user);
    res.status(201).json(project);
  } catch (err: any) {
    sendError(res, err, 'Error al crear proyecto');
  }
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user);
    res.json(project);
  } catch (err: any) {
    sendError(res, err, 'Error al obtener proyecto');
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user);
    res.json(project);
  } catch (err: any) {
    sendError(res, err, 'Error al actualizar proyecto');
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user);
    res.json(result);
  } catch (err: any) {
    sendError(res, err, 'Error al eliminar proyecto');
  }
}

export async function duplicate(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await projectService.duplicateProject(req.params.id, req.user);
    res.status(201).json(project);
  } catch (err: any) {
    sendError(res, err, 'Error al duplicar proyecto');
  }
}
