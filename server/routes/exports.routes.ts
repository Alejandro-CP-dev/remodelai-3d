import { Router } from 'express';
import * as exportsController from '../controllers/exports.controller';

export const exportsRouter = Router();

exportsRouter.post('/', exportsController.create);
