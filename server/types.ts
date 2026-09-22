import { Request } from 'express';
import { User } from '../src/types';

// Express Request extended with the authenticated user resolved by server/middleware/auth.ts
export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}
