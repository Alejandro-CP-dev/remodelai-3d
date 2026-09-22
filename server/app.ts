import express, { Express } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authMiddleware } from './middleware/auth';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { projectsRouter } from './routes/projects.routes';
import { sharesRouter } from './routes/shares.routes';
import { adminRouter } from './routes/admin.routes';
import { exportsRouter } from './routes/exports.routes';
import { aiRouter } from './routes/ai.routes';

export async function createApp(): Promise<Express> {
  const app = express();

  // Security headers & payload parsing
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Auth session middleware — populates req.user from the Bearer token, when present
  app.use(authMiddleware);

  // ==========================================
  // API ROUTES
  // ==========================================
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/shares', sharesRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/exports', exportsRouter);
  app.use('/api/ai', aiRouter);

  // ==========================================
  // VITE OR STATIC FRONTEND SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
