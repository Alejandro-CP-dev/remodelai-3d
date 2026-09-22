import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { serverDb, hashPassword } from './server/db';
import { ServerAIService } from './server/geminiService';
import { User, Project, ShareLink } from './src/types';

// Load GEMINI_API_KEY etc. from .env.local (falls back to .env if present).
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Extended Express Request with Authenticated User
export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Security Headers & Payload parsing
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // 2. Auth Session Middleware
  app.use(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await serverDb.getSessionUser(token);
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
  });

  // Admin Guard Middleware
  const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
      await serverDb.logAudit({
        userId: req.user?.id || 'anon',
        userName: req.user?.name || 'Anónimo',
        userEmail: req.user?.email || '',
        action: 'error',
        entityType: 'auth',
        entityId: req.originalUrl,
        status: 'FAILED',
        metadata: { reason: 'Unauthorized admin resource attempt' }
      });
      return res.status(403).json({ error: 'Acceso denegado: se requieren permisos de administrador' });
    }
    next();
  };

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY')
    });
  });

  // --- AUTH ENDPOINTS ---

  // Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const existing = await serverDb.findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Este correo electrónico ya se encuentra registrado' });
      }

      const user = await serverDb.createUser({ name, email, password, emailVerified: false });
      const sessionToken = await serverDb.createSession(user.id);

      await serverDb.logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'register',
        entityType: 'auth',
        entityId: user.id,
        status: 'SUCCESS',
        metadata: { verificationCode: user.verificationCode }
      });

      res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          status: user.status
        },
        token: sessionToken,
        verificationCode: user.verificationCode // for verification in simulation tests
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error en el registro de usuario' });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'El correo electrónico es requerido' });
      }

      const user = await serverDb.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // If password provided, verify hash
      if (password && user.salt && user.passwordHash) {
        const hash = hashPassword(password, user.salt);
        if (hash !== user.passwordHash) {
          await serverDb.logAudit({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            action: 'login',
            entityType: 'auth',
            entityId: user.id,
            status: 'FAILED',
            metadata: { reason: 'Incorrect password' }
          });
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Tu cuenta requiere verificación de correo electrónico',
          userId: user.id
        });
      }

      const token = await serverDb.createSession(user.id);
      user.lastLoginAt = new Date().toISOString();
      await serverDb.updateUser(user);

      await serverDb.logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'login',
        entityType: 'auth',
        entityId: user.id,
        status: 'SUCCESS'
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          status: user.status,
          avatarUrl: user.avatarUrl
        },
        token
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al iniciar sesión' });
    }
  });

  // Google Sign-in / SSO
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { email, name } = req.body;
      const targetEmail = email || 'jalejandrocp29@gmail.com';
      let user = await serverDb.findUserByEmail(targetEmail);

      if (!user) {
        user = await serverDb.createUser({
          name: name || 'Alejandro Carrillo',
          email: targetEmail,
          emailVerified: true
        });
      } else if (!user.emailVerified) {
        user.emailVerified = true;
        user.status = 'ACTIVE';
        await serverDb.updateUser(user);
      }

      const token = await serverDb.createSession(user.id);

      await serverDb.logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'login',
        entityType: 'auth',
        entityId: user.id,
        status: 'SUCCESS',
        metadata: { provider: 'google_sso' }
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          status: user.status,
          avatarUrl: user.avatarUrl
        },
        token
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al autenticar con Google' });
    }
  });

  // Verify Email
  app.post('/api/auth/verify-email', async (req, res) => {
    try {
      const { userId, code } = req.body;
      const user = await serverDb.findUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Accepts user's generated verificationCode or simulator bypass '123456'
      if (code && user.verificationCode && code !== user.verificationCode && code !== '123456') {
        return res.status(400).json({ error: 'Código de verificación incorrecto' });
      }

      user.emailVerified = true;
      user.status = 'ACTIVE';
      await serverDb.updateUser(user);

      const token = await serverDb.createSession(user.id);

      await serverDb.logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'register',
        entityType: 'auth',
        entityId: user.id,
        status: 'SUCCESS',
        metadata: { verified: true }
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: true,
          status: 'ACTIVE'
        },
        token
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al verificar correo' });
    }
  });

  // Get Current User (Me)
  app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    res.json({ user: req.user });
  });

  // Logout
  app.post('/api/auth/logout', async (req: AuthenticatedRequest, res) => {
    if (req.token) {
      await serverDb.removeSession(req.token);
    }
    res.json({ success: true });
  });

  // Public/Admin list of demo users for switcher
  app.get('/api/auth/users', async (req: AuthenticatedRequest, res) => {
    const users = (await serverDb.getUsers()).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      emailVerified: u.emailVerified,
      status: u.status,
      avatarUrl: u.avatarUrl
    }));
    res.json(users);
  });

  // --- PROJECTS ENDPOINTS ---

  // List projects (RLS enforced)
  app.get('/api/projects', async (req: AuthenticatedRequest, res) => {
    const isAdmin = req.user?.role === 'admin';
    const userId = req.user?.id || (req.query.userId as string);
    const projects = await serverDb.getProjects(userId, isAdmin);
    res.json(projects);
  });

  // Create project
  app.post('/api/projects', async (req: AuthenticatedRequest, res) => {
    try {
      const { name, dimensions } = req.body;
      const ownerId = req.user?.id || req.body.ownerId || 'usr-default-02';
      const ownerName = req.user?.name || req.body.ownerName || 'Alejandro Carrillo';

      // If the client already assembled a full project locally (StorageService.createProject
      // builds its own id/scene before syncing), persist it as-is instead of generating a
      // second, different id — otherwise client and server would permanently disagree on the
      // project's identity and every future PUT would 404.
      if (req.body.id && req.body.scene) {
        const clientProject: Project = {
          id: req.body.id,
          name: name || 'Nuevo Espacio 3D',
          description: req.body.description || 'Espacio creado con RemodelAI 3D',
          ownerId,
          ownerName,
          createdAt: req.body.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: req.body.status || 'active',
          version: req.body.version || 1,
          thumbnailUrl: req.body.thumbnailUrl,
          scene: req.body.scene
        };

        await serverDb.saveProject(clientProject);
        await serverDb.logAudit({
          userId: ownerId,
          userName: ownerName,
          action: 'project_create',
          entityType: 'project',
          entityId: clientProject.id,
          status: 'SUCCESS',
          metadata: { name: clientProject.name }
        });

        return res.status(201).json(clientProject);
      }

      const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const sceneId = `scn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const width = dimensions?.width || 4.2;
      const length = dimensions?.length || 3.4;
      const height = dimensions?.height || 2.6;

      const newProject: Project = {
        id: projectId,
        name: name || 'Nuevo Espacio 3D',
        description: 'Espacio creado con RemodelAI 3D',
        ownerId,
        ownerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        version: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&fit=crop&q=80',
        scene: {
          id: sceneId,
          projectId,
          version: 1,
          dimensions: { width, length, height },
          materials: {
            wallMaterial: 'pintura',
            wallColor: '#f1f5f9',
            floorMaterial: 'madera',
            floorColor: '#a16207',
            ceilingColor: '#ffffff',
            ceilingVisible: false
          },
          lightingPreset: 'dia',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          objects: [
            {
              id: `obj-door-${Date.now()}`,
              sceneId,
              name: 'Puerta Principal de Paso',
              category: 'estructura',
              type: 'door',
              position: { x: 0, y: 1.05, z: -length / 2 + 0.05 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
              color: '#57534e',
              material: 'madera',
              visible: true
            },
            {
              id: `obj-win-${Date.now()}`,
              sceneId,
              name: 'Ventanal con Vista',
              category: 'estructura',
              type: 'window',
              position: { x: width / 2 - 0.05, y: 1.35, z: 0 },
              rotation: { x: 0, y: -90, z: 0 },
              scale: { x: 1.2, y: 1.1, z: 1 },
              color: '#0284c7',
              material: 'cristal_aluminio',
              visible: true
            }
          ]
        }
      };

      await serverDb.saveProject(newProject);
      await serverDb.logAudit({
        userId: ownerId,
        userName: ownerName,
        action: 'project_create',
        entityType: 'project',
        entityId: newProject.id,
        status: 'SUCCESS',
        metadata: { name: newProject.name }
      });

      res.status(201).json(newProject);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al crear proyecto' });
    }
  });

  // Get project by ID
  app.get('/api/projects/:id', async (req: AuthenticatedRequest, res) => {
    const project = await serverDb.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    // RLS validation
    if (req.user && req.user.role !== 'admin' && project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este proyecto' });
    }
    res.json(project);
  });

  // Update project / scene
  app.put('/api/projects/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const existing = await serverDb.getProjectById(req.params.id);
      if (!existing) {
        // Upsert fallback: the client may be syncing a locally-created project whose
        // initial POST never reached the server (e.g. it was created while offline).
        // Accept it here instead of permanently 404ing on every future save.
        if (req.body.scene) {
          const ownerId = req.user?.id || req.body.ownerId || 'usr-default-02';
          const ownerName = req.user?.name || req.body.ownerName || 'Alejandro Carrillo';
          const created: Project = {
            id: req.params.id,
            name: req.body.name || 'Nuevo Espacio 3D',
            description: req.body.description || 'Espacio creado con RemodelAI 3D',
            ownerId,
            ownerName,
            createdAt: req.body.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: req.body.status || 'active',
            version: req.body.version || 1,
            thumbnailUrl: req.body.thumbnailUrl,
            scene: req.body.scene
          };
          await serverDb.saveProject(created);
          return res.json(created);
        }
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      if (req.user && req.user.role !== 'admin' && existing.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para modificar este proyecto' });
      }

      const updated: Project = {
        ...existing,
        ...req.body,
        id: existing.id,
        updatedAt: new Date().toISOString()
      };

      await serverDb.saveProject(updated);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al actualizar proyecto' });
    }
  });

  // Soft delete project
  app.delete('/api/projects/:id', async (req: AuthenticatedRequest, res) => {
    const existing = await serverDb.getProjectById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (req.user && req.user.role !== 'admin' && existing.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este proyecto' });
    }

    const success = await serverDb.softDeleteProject(req.params.id);
    await serverDb.logAudit({
      userId: req.user?.id || existing.ownerId,
      userName: req.user?.name || existing.ownerName,
      action: 'project_delete',
      entityType: 'project',
      entityId: existing.id,
      status: 'SUCCESS',
      metadata: { softDelete: true }
    });

    res.json({ success });
  });

  // Duplicate project
  app.post('/api/projects/:id/duplicate', async (req: AuthenticatedRequest, res) => {
    const original = await serverDb.getProjectById(req.params.id);
    if (!original) {
      return res.status(404).json({ error: 'Proyecto original no encontrado' });
    }

    const targetUserId = req.user?.id || original.ownerId;
    const targetUserName = req.user?.name || original.ownerName;

    const newId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSceneId = `scn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const duplicated: Project = {
      ...original,
      id: newId,
      name: `${original.name} (Copia)`,
      ownerId: targetUserId,
      ownerName: targetUserName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scene: {
        ...original.scene,
        id: newSceneId,
        projectId: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        objects: original.scene.objects.map(obj => ({
          ...obj,
          id: `obj-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sceneId: newSceneId
        }))
      }
    };

    await serverDb.saveProject(duplicated);
    await serverDb.logAudit({
      userId: targetUserId,
      userName: targetUserName,
      action: 'project_create',
      entityType: 'project',
      entityId: duplicated.id,
      status: 'SUCCESS',
      metadata: { duplicatedFrom: original.id }
    });

    res.status(201).json(duplicated);
  });

  // --- SHARE LINKS ENDPOINTS ---

  // Create share link
  app.post('/api/shares', async (req: AuthenticatedRequest, res) => {
    try {
      const { projectId } = req.body;
      const proj = await serverDb.getProjectById(projectId);
      if (!proj) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      const creatorId = req.user?.id || proj.ownerId;
      const creatorName = req.user?.name || proj.ownerName;

      const token = `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const share: ShareLink = {
        id: `shr-${Date.now()}`,
        projectId: proj.id,
        projectName: proj.name,
        createdBy: creatorId,
        creatorName,
        token,
        tokenHash: `hash-${token}`,
        isActive: true,
        accessCount: 0,
        createdAt: new Date().toISOString()
      };

      await serverDb.saveShare(share);
      await serverDb.logAudit({
        userId: creatorId,
        userName: creatorName,
        action: 'share_create',
        entityType: 'share',
        entityId: share.id,
        status: 'SUCCESS',
        metadata: { token }
      });

      res.status(201).json(share);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al crear enlace de compartición' });
    }
  });

  // Resolve share link (PUBLIC)
  app.get('/api/shares/:token', async (req, res) => {
    const token = req.params.token;
    const share = await serverDb.getShareByToken(token);
    if (!share || !share.isActive) {
      return res.status(404).json({ error: 'Enlace revocado o no disponible' });
    }

    const project = await serverDb.getProjectById(share.projectId);
    if (!project) {
      return res.status(404).json({ error: 'El proyecto compartido ya no existe' });
    }

    await serverDb.incrementShareVisits(token);
    res.json({
      share,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerName: share.creatorName || project.ownerName,
        scene: project.scene,
        thumbnailUrl: project.thumbnailUrl
      }
    });
  });

  // Revoke share link
  app.post('/api/shares/:token/revoke', async (req: AuthenticatedRequest, res) => {
    const token = req.params.token;
    const share = await serverDb.getShareByToken(token);
    if (!share) {
      return res.status(404).json({ error: 'Enlace no encontrado' });
    }

    share.isActive = false;
    share.revokedAt = new Date().toISOString();
    await serverDb.saveShare(share);

    await serverDb.logAudit({
      userId: req.user?.id || share.createdBy,
      userName: req.user?.name || share.creatorName,
      action: 'share_revoke',
      entityType: 'share',
      entityId: share.id,
      status: 'SUCCESS',
      metadata: { token }
    });

    res.json({ success: true, message: 'Enlace revocado exitosamente' });
  });

  // --- ADMIN & AUDIT ENDPOINTS ---

  // Admin Metrics (Protected)
  app.get('/api/admin/metrics', requireAdmin, async (req, res) => {
    const metrics = await serverDb.getAdminMetrics();
    res.json(metrics);
  });

  // Admin Audit Logs (Protected)
  app.get('/api/admin/audit', requireAdmin, async (req, res) => {
    const logs = await serverDb.getAuditLogs();
    res.json(logs);
  });

  // --- EXPORTS ENDPOINTS ---
  app.post('/api/exports', async (req: AuthenticatedRequest, res) => {
    try {
      const record = req.body;
      await serverDb.saveExport(record);
      await serverDb.logAudit({
        userId: record.userId || req.user?.id || 'anon',
        userName: req.user?.name || 'Usuario',
        action: 'export_render',
        entityType: 'export',
        entityId: record.id || `exp-${Date.now()}`,
        status: 'SUCCESS',
        metadata: { format: record.format, resolution: record.resolution }
      });
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al registrar exportación' });
    }
  });

  // --- AI GENERATION ENDPOINT ---
  app.post('/api/ai/generate-room', async (req: AuthenticatedRequest, res) => {
    try {
      const result = await ServerAIService.generateRoom(req.body);
      await serverDb.incrementAIGenerations();

      await serverDb.logAudit({
        userId: req.user?.id || req.body.userId || 'anon',
        userName: req.user?.name || 'Usuario',
        action: 'ai_generate',
        entityType: 'generation',
        entityId: `gen-${Date.now()}`,
        status: 'SUCCESS',
        metadata: { model: result.modelUsed, prompt: req.body.prompt?.substring(0, 50) }
      });

      res.json(result);
    } catch (err: any) {
      await serverDb.logAudit({
        userId: req.user?.id || req.body.userId || 'anon',
        userName: req.user?.name || 'Usuario',
        action: 'ai_generate',
        entityType: 'generation',
        entityId: `gen-err-${Date.now()}`,
        status: 'FAILED',
        metadata: { error: err.message }
      });

      res.status(500).json({ error: err.message || 'Error al generar la habitación' });
    }
  });

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RemodelAI 3D Engine] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
