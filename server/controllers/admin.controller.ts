import { Response } from 'express';
import * as adminService from '../services/admin.service';
import { AuthenticatedRequest } from '../types';

export async function metrics(req: AuthenticatedRequest, res: Response) {
  res.json(await adminService.getMetrics());
}

export async function auditLogs(req: AuthenticatedRequest, res: Response) {
  res.json(await adminService.getAuditLogs());
}
