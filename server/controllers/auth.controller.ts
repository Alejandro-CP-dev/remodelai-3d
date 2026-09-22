import { Response } from 'express';
import * as authService from '../services/auth.service';
import { sendError } from '../utils/httpError';
import { AuthenticatedRequest } from '../types';

export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    sendError(res, err, 'Error en el registro de usuario');
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (err: any) {
    sendError(res, err, 'Error al iniciar sesión');
  }
}

export async function google(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await authService.loginWithGoogle(req.body);
    res.json(result);
  } catch (err: any) {
    sendError(res, err, 'Error al autenticar con Google');
  }
}

export async function verifyEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await authService.verifyEmail(req.body);
    res.json(result);
  } catch (err: any) {
    sendError(res, err, 'Error al verificar correo');
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  res.json({ user: req.user });
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  await authService.logout(req.token);
  res.json({ success: true });
}

export async function listUsers(req: AuthenticatedRequest, res: Response) {
  const users = await authService.listUsers();
  res.json(users);
}
