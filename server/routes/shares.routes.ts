import { Router } from 'express';
import * as sharesController from '../controllers/shares.controller';

export const sharesRouter = Router();

sharesRouter.post('/', sharesController.create);
sharesRouter.get('/:token', sharesController.resolve);
sharesRouter.post('/:token/revoke', sharesController.revoke);
