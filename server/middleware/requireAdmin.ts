import { Response, NextFunction } from 'express';
import { logAudit } from '../repositories/audit.repository';
import { AuthenticatedRequest } from '../types';

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    await logAudit({
      userId: req.user?.id || 'anon',
      userName: req.user?.name || 'Anónimo',
      userEmail: req.user?.email || '',
      action: 'error',
      entityType: 'auth',
      entityId: req.originalUrl,
      status: 'FAILED',
      metadata: { reason: 'Unauthorized admin resource attempt' }
    });
    return res.status(403).json({ error: 'Acceso denegado: se requieren permisos de administrador' });
  }
  next();
}
