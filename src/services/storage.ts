import {
  User,
  Project,
  Scene,
  Object3DItem,
  AIGeneration,
  ExportRecord,
  ShareLink,
  ShareAccessLog,
  AuditLog,
  AdminMetrics
} from '../types';
import { apiClient } from './apiClient';

const STORAGE_KEYS = {
  USERS: 'remodelai_users',
  CURRENT_USER: 'remodelai_current_user',
  PROJECTS: 'remodelai_projects',
  AI_GENERATIONS: 'remodelai_ai_generations',
  EXPORTS: 'remodelai_exports',
  SHARE_LINKS: 'remodelai_share_links',
  SHARE_ACCESS_LOGS: 'remodelai_share_access_logs',
  AUDIT_LOGS: 'remodelai_audit_logs',
  OFFLINE_PENDING: 'remodelai_offline_pending'
};

// Seed initial demo users
const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-01',
    name: 'Carlos Ruiz (Admin)',
    email: 'admin@remodelai.com',
    role: 'admin',
    emailVerified: true,
    status: 'ACTIVE',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80'
  },
  {
    id: 'usr-default-02',
    name: 'Alejandro Carrillo',
    email: 'jalejandrocp29@gmail.com',
    role: 'user',
    emailVerified: true,
    status: 'ACTIVE',
    createdAt: '2026-08-15T14:30:00.000Z',
    updatedAt: '2026-08-15T14:30:00.000Z',
    lastLoginAt: new Date().toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80'
  },
  {
    id: 'usr-unverified-03',
    name: 'María Gómez (Pendiente)',
    email: 'maria.gomez@ejemplo.com',
    role: 'user',
    emailVerified: false,
    status: 'PENDIENTE_VERIFICACION',
    createdAt: '2026-09-02T16:00:00.000Z',
    updatedAt: '2026-09-02T16:00:00.000Z'
  }
];

// Seed initial demo project with realistic 3D interior
const createSampleProject = (ownerId: string, ownerName: string): Project => {
  const sceneId = 'scn-dormitorio-master';
  const sampleObjects: Object3DItem[] = [
    {
      id: 'obj-cama-1',
      sceneId,
      name: 'Cama Queen Nórdica',
      category: 'muebles',
      type: 'bed',
      position: { x: 0.9, y: 0.45, z: 0.0 },
      rotation: { x: 0, y: -90, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#e2e8f0',
      material: 'textil',
      visible: true
    },
    {
      id: 'obj-mesita-1',
      sceneId,
      name: 'Mesita de Noche Japandi',
      category: 'muebles',
      type: 'table',
      position: { x: 0.9, y: 0.28, z: 1.3 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#d97706',
      material: 'madera',
      visible: true
    },
    {
      id: 'obj-lampara-1',
      sceneId,
      name: 'Lámpara de Noche',
      category: 'decoracion',
      type: 'lamp',
      position: { x: 0.9, y: 0.65, z: 1.3 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.7, y: 0.7, z: 0.7 },
      color: '#f59e0b',
      material: 'metal_laton',
      visible: true
    },
    {
      id: 'obj-escritorio-1',
      sceneId,
      name: 'Escritorio Minimalista',
      category: 'muebles',
      type: 'desk',
      position: { x: -1.1, y: 0.38, z: 0.6 },
      rotation: { x: 0, y: 90, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#92400e',
      material: 'madera',
      visible: true
    },
    {
      id: 'obj-silla-1',
      sceneId,
      name: 'Silla de Oficina Soft',
      category: 'muebles',
      type: 'chair',
      position: { x: -0.6, y: 0.48, z: 0.6 },
      rotation: { x: 0, y: -90, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#334155',
      material: 'textil',
      visible: true
    },
    {
      id: 'obj-alfombra-1',
      sceneId,
      name: 'Alfombra Geométrica Bereber',
      category: 'decoracion',
      type: 'rug',
      position: { x: 0.1, y: 0.01, z: 0.0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1.1, y: 1, z: 1.1 },
      color: '#f1f5f9',
      material: 'lana',
      visible: true
    },
    {
      id: 'obj-planta-1',
      sceneId,
      name: 'Planta Monstera en Maceta',
      category: 'decoracion',
      type: 'plant',
      position: { x: -1.3, y: 0.45, z: -1.0 },
      rotation: { x: 0, y: 45, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#15803d',
      material: 'organico',
      visible: true
    },
    {
      id: 'obj-cuadro-1',
      sceneId,
      name: 'Cuadro Abstracto Minimalista',
      category: 'decoracion',
      type: 'painting',
      position: { x: 1.95, y: 1.6, z: 0.0 },
      rotation: { x: 0, y: -90, z: 0 },
      scale: { x: 1.2, y: 1.2, z: 1 },
      color: '#6366f1',
      material: 'lienzo',
      visible: true
    },
    {
      id: 'obj-ventana-1',
      sceneId,
      name: 'Ventana Panorámica',
      category: 'estructura',
      type: 'window',
      position: { x: -1.95, y: 1.5, z: 0.5 },
      rotation: { x: 0, y: 90, z: 0 },
      scale: { x: 1.2, y: 1, z: 1 },
      color: '#0284c7',
      material: 'cristal_aluminio',
      visible: true
    },
    {
      id: 'obj-puerta-1',
      sceneId,
      name: 'Puerta Principal de Paso',
      category: 'estructura',
      type: 'door',
      position: { x: 0.0, y: 1.05, z: -1.45 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#78350f',
      material: 'madera',
      visible: true
    }
  ];

  return {
    id: 'prj-dormitorio-nordico',
    ownerId,
    ownerName,
    name: 'Remodelación Dormitorio Nórdico',
    description: 'Habitación de 4.0m x 3.0m con cama queen, escritorio junto al ventanal y piso de madera cálida.',
    status: 'active',
    version: 3,
    thumbnailUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-08-20T11:00:00.000Z',
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    scene: {
      id: sceneId,
      projectId: 'prj-dormitorio-nordico',
      version: 3,
      dimensions: { width: 4.0, length: 3.0, height: 2.6 },
      materials: {
        wallMaterial: 'pintura',
        wallColor: '#f8fafc',
        floorMaterial: 'madera',
        floorColor: '#b45309',
        ceilingColor: '#ffffff',
        ceilingVisible: false
      },
      lightingPreset: 'dia',
      createdAt: '2026-08-20T11:00:00.000Z',
      updatedAt: new Date().toISOString(),
      objects: sampleObjects
    }
  };
};

export class StorageService {
  // Safe localStorage helper
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (err) {
      console.error(`Error reading ${key} from storage:`, err);
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error writing ${key} to storage:`, err);
    }
  }

  // --- INITIALIZATION ---
  static initialize() {
    const existingUsers = this.getItem<User[]>(STORAGE_KEYS.USERS, []);
    if (existingUsers.length === 0) {
      this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }

    // Note: intentionally does NOT auto-set a current user here. Doing so would
    // silently log every first-time visitor in as the demo account, making the
    // landing page (which only shows when getCurrentUser() is null) unreachable.
    // Login still happens explicitly via the landing CTA, auth modal, etc.

    const projects = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    if (projects.length === 0) {
      const sample = createSampleProject(INITIAL_USERS[1].id, INITIAL_USERS[1].name);
      this.setItem(STORAGE_KEYS.PROJECTS, [sample]);
    }

    // Initial audit log
    const auditLogs = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    if (auditLogs.length === 0) {
      this.logAudit({
        userId: 'usr-default-02',
        userName: 'Alejandro Carrillo',
        userEmail: 'jalejandrocp29@gmail.com',
        action: 'login',
        entityType: 'auth',
        entityId: 'usr-default-02',
        status: 'SUCCESS',
        metadata: { method: 'email_password', ip: '192.168.1.1' }
      });
    }
  }

  // --- AUTH & USERS ---
  static getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static getCurrentUser(): User | null {
    return this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  static setCurrentUser(user: User | null): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  static registerUser(name: string, email: string): { user: User; verificationToken: string } {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: 'user',
      emailVerified: false,
      status: 'PENDIENTE_VERIFICACION',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    this.setItem(STORAGE_KEYS.USERS, users);

    const verificationToken = `token-verify-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.logAudit({
      userId: newUser.id,
      userName: newUser.name,
      userEmail: newUser.email,
      action: 'register',
      entityType: 'auth',
      entityId: newUser.id,
      status: 'SUCCESS',
      metadata: { verificationRequired: true }
    });

    return { user: newUser, verificationToken };
  }

  static verifyEmail(userId: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('Usuario no encontrado.');

    user.emailVerified = true;
    user.status = 'ACTIVE';
    user.updatedAt = new Date().toISOString();
    user.lastLoginAt = new Date().toISOString();

    this.setItem(STORAGE_KEYS.USERS, users);
    this.setCurrentUser(user);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'login',
      entityType: 'auth',
      entityId: user.id,
      status: 'SUCCESS',
      metadata: { note: 'email_verified_auto_login' }
    });

    return user;
  }

  static updateUserProfile(userId: string, updates: { name?: string; email?: string; avatarUrl?: string }): User {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('Usuario no encontrado.');

    if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = users.some(u => u.id !== userId && u.email.toLowerCase() === updates.email!.toLowerCase());
      if (emailTaken) {
        throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
      }
      user.email = updates.email;
    }

    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error('El nombre no puede estar vacío.');
      }
      user.name = updates.name.trim();
    }

    if (updates.avatarUrl !== undefined) {
      user.avatarUrl = updates.avatarUrl;
    }

    user.updatedAt = new Date().toISOString();
    this.setItem(STORAGE_KEYS.USERS, users);

    const current = this.getCurrentUser();
    if (current?.id === userId) {
      this.setCurrentUser(user);
    }

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'profile_update',
      entityType: 'user',
      entityId: user.id,
      status: 'SUCCESS',
      metadata: { updatedFields: Object.keys(updates) }
    });

    return user;
  }

  static setUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE', actingAdmin?: User | null): User {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('Usuario no encontrado.');

    if (actingAdmin?.id === userId) {
      throw new Error('No puedes inactivar tu propia cuenta de administrador.');
    }
    if (user.role === 'admin' && status === 'INACTIVE') {
      throw new Error('No se puede inactivar a otro administrador desde este panel.');
    }

    user.status = status;
    user.updatedAt = new Date().toISOString();
    this.setItem(STORAGE_KEYS.USERS, users);

    // If the affected user is the current session, force logout when deactivated
    const current = this.getCurrentUser();
    if (current?.id === userId) {
      if (status === 'INACTIVE') {
        this.setCurrentUser(null);
      } else {
        this.setCurrentUser(user);
      }
    }

    this.logAudit({
      userId: actingAdmin?.id || 'system',
      userName: actingAdmin?.name || 'Sistema',
      userEmail: actingAdmin?.email || '',
      action: 'user_status_change',
      entityType: 'user',
      entityId: user.id,
      status: 'SUCCESS',
      metadata: { targetUser: user.email, newStatus: status }
    });

    return user;
  }

  static login(email: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      this.logAudit({
        userId: 'anonymous',
        userName: 'Desconocido',
        userEmail: email,
        action: 'login',
        entityType: 'auth',
        entityId: 'unknown',
        status: 'FAILED',
        metadata: { reason: 'invalid_credentials' }
      });
      throw new Error('Credenciales incorrectas o correo no registrado.');
    }

    if (!user.emailVerified) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    if (user.status === 'INACTIVE') {
      this.logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'login',
        entityType: 'auth',
        entityId: user.id,
        status: 'FAILED',
        metadata: { reason: 'account_inactive' }
      });
      throw new Error('ACCOUNT_INACTIVE');
    }

    user.lastLoginAt = new Date().toISOString();
    this.setItem(STORAGE_KEYS.USERS, users);
    this.setCurrentUser(user);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'login',
      entityType: 'auth',
      entityId: user.id,
      status: 'SUCCESS',
      metadata: { method: 'standard_login' }
    });

    return user;
  }

  static loginWithGoogle(): User {
    const users = this.getUsers();
    let user = users.find(u => u.email === 'jalejandrocp29@gmail.com');
    if (!user) {
      user = {
        id: `usr-google-${Date.now()}`,
        name: 'Alejandro Carrillo',
        email: 'jalejandrocp29@gmail.com',
        role: 'user',
        emailVerified: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80'
      };
      users.push(user);
      this.setItem(STORAGE_KEYS.USERS, users);
    } else {
      user.emailVerified = true;
      user.status = 'ACTIVE';
      user.lastLoginAt = new Date().toISOString();
      this.setItem(STORAGE_KEYS.USERS, users);
    }

    this.setCurrentUser(user);
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'login',
      entityType: 'auth',
      entityId: user.id,
      status: 'SUCCESS',
      metadata: { provider: 'google_oauth' }
    });
    return user;
  }

  static logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'login',
        entityType: 'auth',
        entityId: user.id,
        status: 'SUCCESS',
        metadata: { event: 'logout' }
      });
    }
    this.setCurrentUser(null);
  }

  // --- PROJECTS (WITH RLS & SOFT DELETE) ---
  static getProjects(userId?: string): Project[] {
    const all = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    // Only return non-soft-deleted projects
    const active = all.filter(p => !p.deletedAt);
    if (!userId) return active;
    // RLS: user can only see their own projects (admins can see all if required)
    const currentUser = this.getCurrentUser();
    if (currentUser?.role === 'admin') return active;
    return active.filter(p => p.ownerId === userId);
  }

  static getProjectById(projectId: string, requestUserId?: string): Project | null {
    const all = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    const proj = all.find(p => p.id === projectId && !p.deletedAt);
    if (!proj) return null;

    // RLS Security Check: Usuario A intentando acceder al proyecto de Usuario B
    const user = this.getCurrentUser();
    const effectiveUserId = requestUserId || user?.id;

    // Check permissions
    if (user?.role !== 'admin' && effectiveUserId && proj.ownerId !== effectiveUserId) {
      // Check if it's shared
      const share = this.getShareLinks().find(s => s.projectId === projectId && s.isActive);
      if (!share) {
        throw new Error('403_FORBIDDEN: No tienes autorización para acceder a este proyecto ajeno.');
      }
    }

    return proj;
  }

  static saveProject(project: Project): Project {
    const all = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    project.updatedAt = new Date().toISOString();
    project.version = (project.version || 1) + 1;
    project.scene.version = project.version;

    // Check maximum 100 objects limit
    if (project.scene.objects.length > 100) {
      throw new Error('Has alcanzado el límite de 100 objetos para este proyecto.');
    }

    const index = all.findIndex(p => p.id === project.id);
    if (index >= 0) {
      all[index] = project;
    } else {
      all.unshift(project);
    }
    this.setItem(STORAGE_KEYS.PROJECTS, all);

    this.logAudit({
      userId: project.ownerId,
      userName: project.ownerName,
      userEmail: '',
      action: 'edit_scene',
      entityType: 'project',
      entityId: project.id,
      status: 'SUCCESS',
      metadata: { objectCount: project.scene.objects.length, version: project.version }
    });

    // Asynchronous backend persistence
    apiClient.updateProject(project.id, project).catch(err => {
      console.warn('Backend sync failed (running in offline/local cache mode):', err);
    });

    return project;
  }

  static createProject(params: {
    ownerId: string;
    ownerName: string;
    name: string;
    description?: string;
    dimensions?: { width: number; length: number; height: number };
  }): Project {
    const newId = `prj-${Date.now()}`;
    const sceneId = `scn-${Date.now()}`;
    const dimensions = params.dimensions || { width: 4.0, length: 3.0, height: 2.6 };

    const newProject: Project = {
      id: newId,
      ownerId: params.ownerId,
      ownerName: params.ownerName,
      name: params.name,
      description: params.description || 'Proyecto de remodelación 3D',
      status: 'active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      scene: {
        id: sceneId,
        projectId: newId,
        version: 1,
        dimensions,
        materials: {
          wallMaterial: 'pintura',
          wallColor: '#f8fafc',
          floorMaterial: 'madera',
          floorColor: '#b45309',
          ceilingColor: '#ffffff',
          ceilingVisible: false
        },
        lightingPreset: 'dia',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        objects: [
          // Base door and window for convenience
          {
            id: `obj-puerta-${Date.now()}`,
            sceneId,
            name: 'Puerta de Paso',
            category: 'estructura',
            type: 'door',
            position: { x: 0, y: 1.05, z: -(dimensions.length / 2) + 0.05 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#78350f',
            material: 'madera',
            visible: true
          },
          {
            id: `obj-ventana-${Date.now()}`,
            sceneId,
            name: 'Ventana',
            category: 'estructura',
            type: 'window',
            position: { x: -(dimensions.width / 2) + 0.05, y: 1.4, z: 0 },
            rotation: { x: 0, y: 90, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#0284c7',
            material: 'cristal_aluminio',
            visible: true
          }
        ]
      }
    };

    const all = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    all.unshift(newProject);
    this.setItem(STORAGE_KEYS.PROJECTS, all);

    this.logAudit({
      userId: params.ownerId,
      userName: params.ownerName,
      userEmail: '',
      action: 'project_create',
      entityType: 'project',
      entityId: newProject.id,
      status: 'SUCCESS',
      metadata: { name: newProject.name, dimensions }
    });

    apiClient.createProject(newProject).catch(err => {
      console.warn('Backend sync failed on create:', err);
    });

    return newProject;
  }

  static softDeleteProject(projectId: string): void {
    const all = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    const proj = all.find(p => p.id === projectId);
    if (!proj) return;

    proj.deletedAt = new Date().toISOString();
    proj.status = 'archived';
    this.setItem(STORAGE_KEYS.PROJECTS, all);

    this.logAudit({
      userId: proj.ownerId,
      userName: proj.ownerName,
      userEmail: '',
      action: 'project_delete',
      entityType: 'project',
      entityId: proj.id,
      status: 'SUCCESS',
      metadata: { deletedAt: proj.deletedAt, softDelete: true }
    });

    apiClient.deleteProject(projectId).catch(err => {
      console.warn('Backend delete sync failed:', err);
    });
  }

  static duplicateProject(projectId: string, newOwnerId?: string, newOwnerName?: string): Project {
    const original = this.getProjectById(projectId);
    if (!original) throw new Error('Proyecto no encontrado');

    const currentUser = this.getCurrentUser();
    const ownerId = newOwnerId || currentUser?.id || original.ownerId;
    const ownerName = newOwnerName || currentUser?.name || original.ownerName;

    const clonedId = `prj-copy-${Date.now()}`;
    const clonedSceneId = `scn-copy-${Date.now()}`;

    const clone: Project = {
      ...JSON.parse(JSON.stringify(original)),
      id: clonedId,
      ownerId,
      ownerName,
      name: `${original.name} (Copia)`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      scene: {
        ...JSON.parse(JSON.stringify(original.scene)),
        id: clonedSceneId,
        projectId: clonedId,
        version: 1
      }
    };

    const all = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    all.unshift(clone);
    this.setItem(STORAGE_KEYS.PROJECTS, all);

    this.logAudit({
      userId: ownerId,
      userName: ownerName,
      userEmail: '',
      action: 'project_create',
      entityType: 'project',
      entityId: clone.id,
      status: 'SUCCESS',
      metadata: { clonedFrom: original.id, note: 'crear_copia_independiente' }
    });

    return clone;
  }

  // --- AI GENERATIONS & HISTORY ---
  static getAIGenerations(projectId?: string): AIGeneration[] {
    const list = this.getItem<AIGeneration[]>(STORAGE_KEYS.AI_GENERATIONS, []);
    if (!projectId) return list;
    return list.filter(g => g.projectId === projectId);
  }

  static saveAIGeneration(generation: AIGeneration): void {
    const list = this.getItem<AIGeneration[]>(STORAGE_KEYS.AI_GENERATIONS, []);
    const index = list.findIndex(g => g.id === generation.id);
    if (index >= 0) {
      list[index] = generation;
    } else {
      list.unshift(generation);
    }
    this.setItem(STORAGE_KEYS.AI_GENERATIONS, list);

    this.logAudit({
      userId: generation.userId,
      userName: 'Usuario',
      userEmail: '',
      action: 'ai_generate',
      entityType: 'generation',
      entityId: generation.id,
      status: generation.status === 'SUCCESS' ? 'SUCCESS' : generation.status === 'TIMEOUT' ? 'TIMEOUT' : 'FAILED',
      metadata: { prompt: generation.prompt, status: generation.status, duration: generation.durationMs }
    });
  }

  // --- EXPORTS ---
  static getExports(userId?: string): ExportRecord[] {
    const list = this.getItem<ExportRecord[]>(STORAGE_KEYS.EXPORTS, []);
    if (!userId) return list;
    return list.filter(e => e.userId === userId);
  }

  static saveExport(record: ExportRecord): void {
    const list = this.getItem<ExportRecord[]>(STORAGE_KEYS.EXPORTS, []);
    list.unshift(record);
    this.setItem(STORAGE_KEYS.EXPORTS, list);

    this.logAudit({
      userId: record.userId,
      userName: 'Usuario',
      userEmail: '',
      action: 'export_render',
      entityType: 'export',
      entityId: record.id,
      status: record.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      metadata: { format: record.format, resolution: record.resolution, project: record.projectName }
    });
  }

  // --- SHARING ---
  static getShareLinks(): ShareLink[] {
    return this.getItem<ShareLink[]>(STORAGE_KEYS.SHARE_LINKS, []);
  }

  static getShareLinkByToken(token: string): ShareLink | null {
    const list = this.getShareLinks();
    return list.find(s => s.token === token) || null;
  }

  static createShareLink(projectId: string, projectName: string, createdBy: string, creatorName: string): ShareLink {
    const list = this.getShareLinks();
    const token = `sh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const tokenHash = btoa(token);

    const share: ShareLink = {
      id: `link-${Date.now()}`,
      projectId,
      projectName,
      createdBy,
      creatorName,
      token,
      tokenHash,
      isActive: true,
      accessCount: 0,
      createdAt: new Date().toISOString(),
      revokedAt: null
    };

    list.unshift(share);
    this.setItem(STORAGE_KEYS.SHARE_LINKS, list);

    this.logAudit({
      userId: createdBy,
      userName: creatorName,
      userEmail: '',
      action: 'share_create',
      entityType: 'share',
      entityId: share.id,
      status: 'SUCCESS',
      metadata: { token, projectId }
    });

    return share;
  }

  static revokeShareLink(shareLinkId: string): void {
    const list = this.getShareLinks();
    const share = list.find(s => s.id === shareLinkId);
    if (!share) return;

    share.isActive = false;
    share.revokedAt = new Date().toISOString();
    this.setItem(STORAGE_KEYS.SHARE_LINKS, list);

    this.logAudit({
      userId: share.createdBy,
      userName: share.creatorName,
      userEmail: '',
      action: 'share_revoke',
      entityType: 'share',
      entityId: share.id,
      status: 'SUCCESS',
      metadata: { token: share.token }
    });
  }

  static logShareAccess(token: string): void {
    const list = this.getShareLinks();
    const share = list.find(s => s.token === token);
    if (!share) return;

    share.accessCount = (share.accessCount || 0) + 1;
    this.setItem(STORAGE_KEYS.SHARE_LINKS, list);

    const accessLogs = this.getItem<ShareAccessLog[]>(STORAGE_KEYS.SHARE_ACCESS_LOGS, []);
    accessLogs.push({
      id: `acc-${Date.now()}`,
      shareLinkId: share.id,
      accessedAt: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50),
      ipMasked: '192.168.***.***'
    });
    this.setItem(STORAGE_KEYS.SHARE_ACCESS_LOGS, accessLogs.slice(-200));
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  static logAudit(entry: Omit<AuditLog, 'id' | 'createdAt'>): void {
    const logs = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const newEntry: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString()
    };
    logs.unshift(newEntry);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 300));
  }

  // --- ADMIN METRICS ---
  static getAdminMetrics(): AdminMetrics {
    const users = this.getUsers();
    const projects = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    const aiGens = this.getItem<AIGeneration[]>(STORAGE_KEYS.AI_GENERATIONS, []);
    const exportsList = this.getItem<ExportRecord[]>(STORAGE_KEYS.EXPORTS, []);
    const shares = this.getShareLinks();

    const successfulGens = aiGens.filter(g => g.status === 'SUCCESS');
    const avgDuration = successfulGens.length > 0
      ? successfulGens.reduce((acc, g) => acc + (g.durationMs || 12000), 0) / successfulGens.length
      : 14500;

    const byFormat: Record<string, number> = { PNG: 0, JPG: 0, WEBP: 0 };
    const byResolution: Record<string, number> = { '1080p': 0, '2K': 0, '4K': 0 };

    exportsList.forEach(e => {
      byFormat[e.format] = (byFormat[e.format] || 0) + 1;
      byResolution[e.resolution] = (byResolution[e.resolution] || 0) + 1;
    });

    return {
      users: {
        total: users.length,
        active: users.filter(u => u.status === 'ACTIVE').length,
        verified: users.filter(u => u.emailVerified).length,
        newToday: users.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length || 1
      },
      projects: {
        total: projects.length,
        active: projects.filter(p => !p.deletedAt).length,
        deleted: projects.filter(p => !!p.deletedAt).length
      },
      aiGenerations: {
        total: aiGens.length,
        successful: successfulGens.length,
        failed: aiGens.filter(g => g.status === 'FAILED').length,
        timeouts: aiGens.filter(g => g.status === 'TIMEOUT').length,
        averageDurationMs: Math.round(avgDuration)
      },
      exports: {
        total: exportsList.length,
        byFormat: byFormat as Record<'PNG' | 'JPG' | 'WEBP', number>,
        byResolution: byResolution as Record<'1080p' | '2K' | '4K', number>
      },
      shares: {
        totalCreated: shares.length,
        active: shares.filter(s => s.isActive).length,
        revoked: shares.filter(s => !s.isActive).length,
        totalViews: shares.reduce((acc, s) => acc + (s.accessCount || 0), 0)
      }
    };
  }

  // --- OFFLINE SYNC RECOVERY ---
  static saveOfflinePendingChanges(projectId: string, scene: Scene): void {
    const pending = this.getItem<Record<string, Scene>>(STORAGE_KEYS.OFFLINE_PENDING, {});
    pending[projectId] = scene;
    this.setItem(STORAGE_KEYS.OFFLINE_PENDING, pending);
  }

  static getOfflinePendingChanges(projectId: string): Scene | null {
    const pending = this.getItem<Record<string, Scene>>(STORAGE_KEYS.OFFLINE_PENDING, {});
    return pending[projectId] || null;
  }

  static clearOfflinePendingChanges(projectId: string): void {
    const pending = this.getItem<Record<string, Scene>>(STORAGE_KEYS.OFFLINE_PENDING, {});
    delete pending[projectId];
    this.setItem(STORAGE_KEYS.OFFLINE_PENDING, pending);
  }

  // --- NETWORK STATUS SIMULATION & HELPER ---
  private static _isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  static isNetworkOnline(): boolean {
    return this._isOnline;
  }

  static setNetworkOnline(online: boolean): void {
    this._isOnline = online;
    if (online) {
      // Auto-sync any offline pending changes
      const pending = this.getItem<Record<string, Scene>>(STORAGE_KEYS.OFFLINE_PENDING, {});
      const projectIds = Object.keys(pending);
      projectIds.forEach(pId => {
        const p = this.getProjectById(pId);
        if (p) {
          p.scene = pending[pId];
          p.updatedAt = new Date().toISOString();
          this.saveProject(p);
        }
      });
      this.setItem(STORAGE_KEYS.OFFLINE_PENDING, {});
    }
  }

  // --- ALIAS FOR SOFT DELETE ---
  static deleteProject(projectId: string, userId?: string): void {
    this.softDeleteProject(projectId);
  }

  // --- EXPORT LOGGING HELPER ---
  static logExport(record: {
    id: string;
    projectId: string;
    userId: string;
    format: 'PNG' | 'JPG' | 'WEBP';
    resolution: '1080p' | '2K' | '4K';
    fileSizeBytes: number;
    createdAt: string;
  }): void {
    const proj = this.getProjectById(record.projectId);
    this.saveExport({
      id: record.id,
      projectId: record.projectId,
      projectName: proj?.name || 'Espacio 3D',
      userId: record.userId,
      format: record.format,
      resolution: record.resolution,
      status: 'SUCCESS',
      fileUrl: '',
      fileSizeMb: Number((record.fileSizeBytes / (1024 * 1024)).toFixed(2)),
      cameraPreset: 'perspectiva',
      lightingPreset: 'dia',
      createdAt: record.createdAt
    });
  }
}
