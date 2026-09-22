import { Response } from 'express';
import { generateRoomAndLog } from '../services/ai.service';
import { AuthenticatedRequest } from '../types';

export async function generateRoom(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await generateRoomAndLog(req.body, req.user);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al generar la habitación' });
  }
}
