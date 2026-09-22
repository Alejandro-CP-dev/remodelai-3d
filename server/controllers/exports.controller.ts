import { Response } from 'express';
import * as exportService from '../services/export.service';
import { sendError } from '../utils/httpError';
import { AuthenticatedRequest } from '../types';

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await exportService.logExport(req.body, req.user);
    res.status(201).json(result);
  } catch (err: any) {
    sendError(res, err, 'Error al registrar exportación');
  }
}
