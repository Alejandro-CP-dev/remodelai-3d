export type UserRole = 'admin' | 'user' | 'visitor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  status: 'ACTIVE' | 'PENDIENTE_VERIFICACION' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  avatarUrl?: string;
}

export interface RoomDimensions {
  width: number;  // X axis (e.g. 4.0m)
  length: number; // Z axis (e.g. 3.0m)
  height: number; // Y axis (e.g. 2.6m)
}

export type WallMaterial = 'pintura' | 'madera' | 'ladrillo' | 'cemento' | 'marmol' | 'ceramica';
export type FloorMaterial = 'madera' | 'ceramica' | 'marmol' | 'cemento' | 'alfombra';
export type LightingPreset = 'natural' | 'dia' | 'atardecer' | 'noche' | 'estandar';
export type CameraPreset = 'perspectiva' | 'superior' | 'frontal' | 'lateral' | 'isometrica';

export interface SceneMaterials {
  wallMaterial: WallMaterial;
  wallColor: string;
  floorMaterial: FloorMaterial;
  floorColor: string;
  ceilingColor: string;
  ceilingVisible: boolean;
}

export type AssetCategory = 'muebles' | 'decoracion' | 'estructura';

export interface LibraryAsset {
  id: string;
  name: string;
  category: AssetCategory;
  type: string;
  description: string;
  thumbnailUrl: string;
  defaultDimensions: { width: number; height: number; depth: number };
  defaultColor: string;
  defaultMaterial: string;
}

export interface Object3DItem {
  id: string;
  sceneId: string;
  libraryAssetId?: string;
  name: string;
  category: AssetCategory;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // In degrees
  scale: { x: number; y: number; z: number };
  color: string;
  material: string;
  roughness?: number;
  metalness?: number;
  visible: boolean;
  locked?: boolean;
}

export interface Scene {
  id: string;
  projectId: string;
  version: number;
  dimensions: RoomDimensions;
  materials: SceneMaterials;
  lightingPreset: LightingPreset;
  objects: Object3DItem[];
  cameraData?: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  version: number;
  thumbnailUrl?: string;
  scene: Scene;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null; // Soft delete
}

export type AIGenerationStatus = 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';

export interface AIGeneration {
  id: string;
  projectId: string;
  userId: string;
  inputImageUrl?: string;
  prompt: string;
  roomDimensions: RoomDimensions;
  status: AIGenerationStatus;
  progressPercent: number;
  stageMessage: string;
  provider: string;
  model: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  resultScene?: Scene;
  createdAt: string;
}

export type ExportFormat = 'PNG' | 'JPG' | 'WEBP';
export type ExportResolution = '1080p' | '2K' | '4K';

export interface ExportRecord {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  format: ExportFormat;
  resolution: ExportResolution;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  fileUrl: string;
  fileSizeMb?: number;
  cameraPreset: CameraPreset;
  lightingPreset: LightingPreset;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  projectId: string;
  projectName: string;
  createdBy: string;
  creatorName: string;
  token: string;
  tokenHash: string;
  isActive: boolean;
  accessCount: number;
  expiresAt?: string;
  createdAt: string;
  revokedAt?: string | null;
}

export interface ShareAccessLog {
  id: string;
  shareLinkId: string;
  accessedAt: string;
  userAgent?: string;
  ipMasked?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'login' | 'register' | 'ai_generate' | 'edit_scene' | 'export_render' | 'share_create' | 'share_revoke' | 'project_create' | 'project_delete' | 'profile_update' | 'user_status_change' | 'error';
  entityType: 'project' | 'scene' | 'generation' | 'export' | 'share' | 'auth' | 'user';
  entityId: string;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AdminMetrics {
  users: {
    total: number;
    active: number;
    verified: number;
    newToday: number;
  };
  projects: {
    total: number;
    active: number;
    deleted: number;
  };
  aiGenerations: {
    total: number;
    successful: number;
    failed: number;
    timeouts: number;
    averageDurationMs: number;
  };
  exports: {
    total: number;
    byFormat: Record<ExportFormat, number>;
    byResolution: Record<ExportResolution, number>;
  };
  shares: {
    totalCreated: number;
    active: number;
    revoked: number;
    totalViews: number;
  };
}
