import { Router } from 'express';
import * as projectsController from '../controllers/projects.controller';

export const projectsRouter = Router();

projectsRouter.get('/', projectsController.list);
projectsRouter.post('/', projectsController.create);
projectsRouter.get('/:id', projectsController.getById);
projectsRouter.put('/:id', projectsController.update);
projectsRouter.delete('/:id', projectsController.remove);
projectsRouter.post('/:id/duplicate', projectsController.duplicate);
