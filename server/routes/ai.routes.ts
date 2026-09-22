import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';

export const aiRouter = Router();

aiRouter.post('/generate-room', aiController.generateRoom);
