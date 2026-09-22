import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/requireAdmin';

export const adminRouter = Router();

adminRouter.get('/metrics', requireAdmin, adminController.metrics);
adminRouter.get('/audit', requireAdmin, adminController.auditLogs);
