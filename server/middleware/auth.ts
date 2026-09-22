import { Response, NextFunction } from 'express';
import { getSessionUser } from '../repositories/user.repository';
import { AuthenticatedRequest } from '../types';

// Populates req.user/req.token from the Bearer session token, when present and valid.
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = await getSessionUser(token);
    if (user) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        avatarUrl: user.avatarUrl
      };
      req.token = token;
    }
  }
  next();
}
