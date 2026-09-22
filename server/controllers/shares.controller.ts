import { Response } from 'express';
import * as shareService from '../services/share.service';
import { sendError } from '../utils/httpError';
import { AuthenticatedRequest } from '../types';

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    const share = await shareService.createShare(req.body.projectId, req.user);
    res.status(201).json(share);
  } catch (err: any) {
    sendError(res, err, 'Error al crear enlace de compartición');
  }
}

export async function resolve(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await shareService.resolveShare(req.params.token);
    res.json(result);
  } catch (err: any) {
    sendError(res, err, 'Error al resolver enlace de compartición');
  }
}

export async function revoke(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await shareService.revokeShare(req.params.token, req.user);
    res.json(result);
  } catch (err: any) {
    sendError(res, err, 'Error al revocar enlace');
  }
}
