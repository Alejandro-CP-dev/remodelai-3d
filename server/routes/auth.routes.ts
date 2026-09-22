import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/google', authController.google);
authRouter.post('/verify-email', authController.verifyEmail);
authRouter.get('/me', authController.me);
authRouter.post('/logout', authController.logout);
authRouter.get('/users', authController.listUsers);
