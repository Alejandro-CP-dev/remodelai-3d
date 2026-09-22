import crypto from 'crypto';
import { getPool, sql } from './db/pool';
import { hashPassword, generateSalt } from './db/crypto';
import {
  User,
  Project,
  Scene,
  ShareLink,
  AuditLog,
  ExportRecord,
  AdminMetrics,
  Object3DItem,
  ExportFormat,
  ExportResolution
} from '../src/types';

export { hashPassword, generateSalt };

// Server-side User representation with salt and hash
export interface ServerUser extends User {
  passwordHash?: string;
  salt?: string;
  verificationCode?: string;
}

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToUser(row: any): ServerUser {
  return {
    id: row.Id,
    name: row.Name,
    email: row.Email,
    role: row.Role,
    emailVerified: !!row.EmailVerified,
    status: row.Status,
    createdAt: toIso(row.CreatedAt),
    updatedAt: toIso(row.UpdatedAt),
    lastLoginAt: row.LastLoginAt ? toIso(row.LastLoginAt) : undefined,
    avatarUrl: row.AvatarUrl || undefined,
    passwordHash: row.PasswordHash || undefined,
    salt: row.Salt || undefined,
    verificationCode: row.VerificationCode || undefined
  };
}

function rowToObject(row: any): Object3DItem {
  return {
    id: row.Id,
    sceneId: row.SceneId,
    libraryAssetId: row.LibraryAssetId || undefined,
    name: row.Name,
    category: row.Category,
    type: row.Type,
    position: { x: row.PosX, y: row.PosY, z: row.PosZ },
    rotation: { x: row.RotX, y: row.RotY, z: row.RotZ },
    scale: { x: row.ScaleX, y: row.ScaleY, z: row.ScaleZ },
    color: row.Color,
    material: row.Material,
    roughness: row.Roughness ?? undefined,
    metalness: row.Metalness ?? undefined,
    visible: !!row.Visible,
    locked: !!row.Locked
  };
}

function rowToScene(sceneRow: any, objectRows: any[]): Scene {
  return {
    id: sceneRow.Id,
    projectId: sceneRow.ProjectId,
    version: sceneRow.Version,
    dimensions: { width: sceneRow.Width, length: sceneRow.Length, height: sceneRow.Height },
    materials: {
      wallMaterial: sceneRow.WallMaterial,
      wallColor: sceneRow.WallColor,
      floorMaterial: sceneRow.FloorMaterial,
      floorColor: sceneRow.FloorColor,
      ceilingColor: sceneRow.CeilingColor,
      ceilingVisible: !!sceneRow.CeilingVisible
    },
    lightingPreset: sceneRow.LightingPreset,
    cameraData: sceneRow.CameraDataJson ? JSON.parse(sceneRow.CameraDataJson) : undefined,
    objects: objectRows.map(rowToObject),
    createdAt: toIso(sceneRow.CreatedAt),
    updatedAt: toIso(sceneRow.UpdatedAt)
  };
}

function rowToProject(projectRow: any, sceneRow: any, objectRows: any[]): Project {
  return {
    id: projectRow.Id,
    ownerId: projectRow.OwnerId,
    ownerName: projectRow.OwnerName,
    name: projectRow.Name,
    description: projectRow.Description || '',
    status: projectRow.Status,
    version: projectRow.Version,
    thumbnailUrl: projectRow.ThumbnailUrl || undefined,
    scene: rowToScene(sceneRow, objectRows),
    createdAt: toIso(projectRow.CreatedAt),
    updatedAt: toIso(projectRow.UpdatedAt),
    deletedAt: projectRow.DeletedAt ? toIso(projectRow.DeletedAt) : null
  };
}

class ServerDatabase {
  // --- USERS ---
  public async getUsers(): Promise<ServerUser[]> {
    const pool = await getPool();
    const { recordset } = await pool.request().query('SELECT * FROM dbo.Users ORDER BY CreatedAt');
    return recordset.map(rowToUser);
  }

  public async findUserById(id: string): Promise<ServerUser | undefined> {
    const pool = await getPool();
    const { recordset } = await pool.request().input('id', sql.NVarChar, id).query('SELECT * FROM dbo.Users WHERE Id = @id');
    return recordset[0] ? rowToUser(recordset[0]) : undefined;
  }

  public async findUserByEmail(email: string): Promise<ServerUser | undefined> {
    const pool = await getPool();
    const clean = email.toLowerCase().trim();
    const { recordset } = await pool.request().input('email', sql.NVarChar, clean).query('SELECT * FROM dbo.Users WHERE LOWER(Email) = @email');
    return recordset[0] ? rowToUser(recordset[0]) : undefined;
  }

  public async createUser(params: {
    name: string;
    email: string;
    password?: string;
    role?: 'admin' | 'user';
    emailVerified?: boolean;
  }): Promise<ServerUser> {
    const pool = await getPool();
    const salt = generateSalt();
    const passwordHash = params.password ? hashPassword(params.password, salt) : null;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const emailVerified = params.emailVerified ?? false;
    const status = emailVerified ? 'ACTIVE' : 'PENDIENTE_VERIFICACION';
    const avatarUrl = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 50000)}?w=100&fit=crop&q=80`;

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, params.name)
      .input('email', sql.NVarChar, params.email.toLowerCase().trim())
      .input('role', sql.NVarChar, params.role || 'user')
      .input('emailVerified', sql.Bit, emailVerified)
      .input('status', sql.NVarChar, status)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('salt', sql.NVarChar, salt)
      .input('verificationCode', sql.NVarChar, verificationCode)
      .input('avatarUrl', sql.NVarChar, avatarUrl)
      .input('createdAt', sql.DateTime2, now)
      .input('updatedAt', sql.DateTime2, now)
      .query(`
        INSERT INTO dbo.Users (Id, Name, Email, Role, EmailVerified, Status, PasswordHash, Salt, VerificationCode, AvatarUrl, CreatedAt, UpdatedAt)
        VALUES (@id, @name, @email, @role, @emailVerified, @status, @passwordHash, @salt, @verificationCode, @avatarUrl, @createdAt, @updatedAt)
      `);

    return (await this.findUserById(id))!;
  }

  public async updateUser(user: ServerUser): Promise<void> {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.NVarChar, user.id)
      .input('name', sql.NVarChar, user.name)
      .input('email', sql.NVarChar, user.email.toLowerCase().trim())
      .input('role', sql.NVarChar, user.role)
      .input('emailVerified', sql.Bit, user.emailVerified)
      .input('status', sql.NVarChar, user.status)
      .input('passwordHash', sql.NVarChar, user.passwordHash || null)
      .input('salt', sql.NVarChar, user.salt || null)
      .input('verificationCode', sql.NVarChar, user.verificationCode || null)
      .input('avatarUrl', sql.NVarChar, user.avatarUrl || null)
      .input('lastLoginAt', sql.DateTime2, user.lastLoginAt ? new Date(user.lastLoginAt) : null)
      .input('updatedAt', sql.DateTime2, new Date())
      .query(`
        UPDATE dbo.Users SET
          Name = @name, Email = @email, Role = @role, EmailVerified = @emailVerified, Status = @status,
          PasswordHash = @passwordHash, Salt = @salt, VerificationCode = @verificationCode,
          AvatarUrl = @avatarUrl, LastLoginAt = @lastLoginAt, UpdatedAt = @updatedAt
        WHERE Id = @id
      `);
  }

  // --- SESSIONS ---
  public async createSession(userId: string): Promise<string> {
    const pool = await getPool();
    const token = `sess_${crypto.randomBytes(32).toString('hex')}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await pool.request()
      .input('token', sql.NVarChar, token)
      .input('userId', sql.NVarChar, userId)
      .input('createdAt', sql.DateTime2, now)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query('INSERT INTO dbo.Sessions (Token, UserId, CreatedAt, ExpiresAt) VALUES (@token, @userId, @createdAt, @expiresAt)');

    return token;
  }

  public async getSessionUser(token: string): Promise<ServerUser | null> {
    const pool = await getPool();
    const { recordset } = await pool.request().input('token', sql.NVarChar, token).query('SELECT * FROM dbo.Sessions WHERE Token = @token');
    const session = recordset[0];
    if (!session) return null;

    if (new Date(session.ExpiresAt) < new Date()) {
      await this.removeSession(token);
      return null;
    }

    return (await this.findUserById(session.UserId)) || null;
  }

  public async removeSession(token: string): Promise<void> {
    const pool = await getPool();
    await pool.request().input('token', sql.NVarChar, token).query('DELETE FROM dbo.Sessions WHERE Token = @token');
  }

  // --- PROJECTS ---
  private async hydrateProjects(pool: sql.ConnectionPool, projectRows: any[]): Promise<Project[]> {
    if (projectRows.length === 0) return [];
    const projectIds = projectRows.map(p => p.Id);

    const idList = projectIds.map((_, i) => `@pid${i}`).join(', ');
    const sceneRequest = pool.request();
    projectIds.forEach((id, i) => sceneRequest.input(`pid${i}`, sql.NVarChar, id));
    const { recordset: sceneRows } = await sceneRequest.query(`SELECT * FROM dbo.Scenes WHERE ProjectId IN (${idList})`);

    const sceneIds = sceneRows.map((s: any) => s.Id);
    let objectRows: any[] = [];
    if (sceneIds.length > 0) {
      const sidList = sceneIds.map((_: string, i: number) => `@sid${i}`).join(', ');
      const objRequest = pool.request();
      sceneIds.forEach((id: string, i: number) => objRequest.input(`sid${i}`, sql.NVarChar, id));
      const { recordset } = await objRequest.query(`SELECT * FROM dbo.SceneObjects WHERE SceneId IN (${sidList})`);
      objectRows = recordset;
    }

    const sceneByProjectId = new Map(sceneRows.map((s: any) => [s.ProjectId, s]));
    const objectsBySceneId = new Map<string, any[]>();
    for (const obj of objectRows) {
      if (!objectsBySceneId.has(obj.SceneId)) objectsBySceneId.set(obj.SceneId, []);
      objectsBySceneId.get(obj.SceneId)!.push(obj);
    }

    return projectRows.map(p => {
      const sceneRow = sceneByProjectId.get(p.Id);
      return rowToProject(p, sceneRow, sceneRow ? objectsBySceneId.get(sceneRow.Id) || [] : []);
    });
  }

  public async getProjects(userId?: string, isAdmin: boolean = false): Promise<Project[]> {
    const pool = await getPool();
    const request = pool.request();
    let query = 'SELECT * FROM dbo.Projects WHERE DeletedAt IS NULL';
    if (!isAdmin && userId) {
      request.input('ownerId', sql.NVarChar, userId);
      query += ' AND OwnerId = @ownerId';
    }
    query += ' ORDER BY CreatedAt DESC';

    const { recordset } = await request.query(query);
    return this.hydrateProjects(pool, recordset);
  }

  public async getProjectById(id: string): Promise<Project | undefined> {
    const pool = await getPool();
    const { recordset } = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM dbo.Projects WHERE Id = @id AND DeletedAt IS NULL');
    if (!recordset[0]) return undefined;
    const [project] = await this.hydrateProjects(pool, recordset);
    return project;
  }

  public async saveProject(project: Project): Promise<void> {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const now = new Date();
      const existing = await new sql.Request(transaction)
        .input('id', sql.NVarChar, project.id)
        .query('SELECT Id FROM dbo.Projects WHERE Id = @id');

      if (existing.recordset.length > 0) {
        await new sql.Request(transaction)
          .input('id', sql.NVarChar, project.id)
          .input('ownerId', sql.NVarChar, project.ownerId)
          .input('ownerName', sql.NVarChar, project.ownerName)
          .input('name', sql.NVarChar, project.name)
          .input('description', sql.NVarChar, project.description || '')
          .input('status', sql.NVarChar, project.status)
          .input('version', sql.Int, project.version)
          .input('thumbnailUrl', sql.NVarChar, project.thumbnailUrl || null)
          .input('updatedAt', sql.DateTime2, now)
          .input('deletedAt', sql.DateTime2, project.deletedAt ? new Date(project.deletedAt) : null)
          .query(`
            UPDATE dbo.Projects SET OwnerId=@ownerId, OwnerName=@ownerName, Name=@name, Description=@description,
              Status=@status, Version=@version, ThumbnailUrl=@thumbnailUrl, UpdatedAt=@updatedAt, DeletedAt=@deletedAt
            WHERE Id=@id
          `);
      } else {
        await new sql.Request(transaction)
          .input('id', sql.NVarChar, project.id)
          .input('ownerId', sql.NVarChar, project.ownerId)
          .input('ownerName', sql.NVarChar, project.ownerName)
          .input('name', sql.NVarChar, project.name)
          .input('description', sql.NVarChar, project.description || '')
          .input('status', sql.NVarChar, project.status)
          .input('version', sql.Int, project.version)
          .input('thumbnailUrl', sql.NVarChar, project.thumbnailUrl || null)
          .input('createdAt', sql.DateTime2, project.createdAt ? new Date(project.createdAt) : now)
          .input('updatedAt', sql.DateTime2, now)
          .query(`
            INSERT INTO dbo.Projects (Id, OwnerId, OwnerName, Name, Description, Status, Version, ThumbnailUrl, CreatedAt, UpdatedAt)
            VALUES (@id, @ownerId, @ownerName, @name, @description, @status, @version, @thumbnailUrl, @createdAt, @updatedAt)
          `);
      }

      const scene = project.scene;
      const sceneExists = await new sql.Request(transaction)
        .input('id', sql.NVarChar, scene.id)
        .query('SELECT Id FROM dbo.Scenes WHERE Id = @id');

      const cameraDataJson = scene.cameraData ? JSON.stringify(scene.cameraData) : null;

      if (sceneExists.recordset.length > 0) {
        await new sql.Request(transaction)
          .input('id', sql.NVarChar, scene.id)
          .input('version', sql.Int, scene.version)
          .input('width', sql.Float, scene.dimensions.width)
          .input('length', sql.Float, scene.dimensions.length)
          .input('height', sql.Float, scene.dimensions.height)
          .input('wallMaterial', sql.NVarChar, scene.materials.wallMaterial)
          .input('wallColor', sql.NVarChar, scene.materials.wallColor)
          .input('floorMaterial', sql.NVarChar, scene.materials.floorMaterial)
          .input('floorColor', sql.NVarChar, scene.materials.floorColor)
          .input('ceilingColor', sql.NVarChar, scene.materials.ceilingColor)
          .input('ceilingVisible', sql.Bit, scene.materials.ceilingVisible)
          .input('lightingPreset', sql.NVarChar, scene.lightingPreset)
          .input('cameraDataJson', sql.NVarChar, cameraDataJson)
          .input('updatedAt', sql.DateTime2, now)
          .query(`
            UPDATE dbo.Scenes SET Version=@version, Width=@width, Length=@length, Height=@height,
              WallMaterial=@wallMaterial, WallColor=@wallColor, FloorMaterial=@floorMaterial, FloorColor=@floorColor,
              CeilingColor=@ceilingColor, CeilingVisible=@ceilingVisible, LightingPreset=@lightingPreset,
              CameraDataJson=@cameraDataJson, UpdatedAt=@updatedAt
            WHERE Id=@id
          `);
      } else {
        await new sql.Request(transaction)
          .input('id', sql.NVarChar, scene.id)
          .input('projectId', sql.NVarChar, project.id)
          .input('version', sql.Int, scene.version)
          .input('width', sql.Float, scene.dimensions.width)
          .input('length', sql.Float, scene.dimensions.length)
          .input('height', sql.Float, scene.dimensions.height)
          .input('wallMaterial', sql.NVarChar, scene.materials.wallMaterial)
          .input('wallColor', sql.NVarChar, scene.materials.wallColor)
          .input('floorMaterial', sql.NVarChar, scene.materials.floorMaterial)
          .input('floorColor', sql.NVarChar, scene.materials.floorColor)
          .input('ceilingColor', sql.NVarChar, scene.materials.ceilingColor)
          .input('ceilingVisible', sql.Bit, scene.materials.ceilingVisible)
          .input('lightingPreset', sql.NVarChar, scene.lightingPreset)
          .input('cameraDataJson', sql.NVarChar, cameraDataJson)
          .input('createdAt', sql.DateTime2, now)
          .input('updatedAt', sql.DateTime2, now)
          .query(`
            INSERT INTO dbo.Scenes (Id, ProjectId, Version, Width, Length, Height, WallMaterial, WallColor,
              FloorMaterial, FloorColor, CeilingColor, CeilingVisible, LightingPreset, CameraDataJson, CreatedAt, UpdatedAt)
            VALUES (@id, @projectId, @version, @width, @length, @height, @wallMaterial, @wallColor,
              @floorMaterial, @floorColor, @ceilingColor, @ceilingVisible, @lightingPreset, @cameraDataJson, @createdAt, @updatedAt)
          `);
      }

      // Replace scene objects wholesale — simplest way to keep them in sync with the
      // client's full-scene payload without diffing individual adds/edits/removes.
      await new sql.Request(transaction)
        .input('sceneId', sql.NVarChar, scene.id)
        .query('DELETE FROM dbo.SceneObjects WHERE SceneId = @sceneId');

      for (const obj of scene.objects) {
        await new sql.Request(transaction)
          .input('id', sql.NVarChar, obj.id)
          .input('sceneId', sql.NVarChar, scene.id)
          .input('libraryAssetId', sql.NVarChar, obj.libraryAssetId || null)
          .input('name', sql.NVarChar, obj.name)
          .input('category', sql.NVarChar, obj.category)
          .input('type', sql.NVarChar, obj.type)
          .input('posX', sql.Float, obj.position.x).input('posY', sql.Float, obj.position.y).input('posZ', sql.Float, obj.position.z)
          .input('rotX', sql.Float, obj.rotation.x).input('rotY', sql.Float, obj.rotation.y).input('rotZ', sql.Float, obj.rotation.z)
          .input('scaleX', sql.Float, obj.scale.x).input('scaleY', sql.Float, obj.scale.y).input('scaleZ', sql.Float, obj.scale.z)
          .input('color', sql.NVarChar, obj.color)
          .input('material', sql.NVarChar, obj.material)
          .input('roughness', sql.Float, obj.roughness ?? null)
          .input('metalness', sql.Float, obj.metalness ?? null)
          .input('visible', sql.Bit, obj.visible)
          .input('locked', sql.Bit, obj.locked ?? false)
          .query(`
            INSERT INTO dbo.SceneObjects (Id, SceneId, LibraryAssetId, Name, Category, Type, PosX, PosY, PosZ,
              RotX, RotY, RotZ, ScaleX, ScaleY, ScaleZ, Color, Material, Roughness, Metalness, Visible, Locked)
            VALUES (@id, @sceneId, @libraryAssetId, @name, @category, @type, @posX, @posY, @posZ,
              @rotX, @rotY, @rotZ, @scaleX, @scaleY, @scaleZ, @color, @material, @roughness, @metalness, @visible, @locked)
          `);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  public async softDeleteProject(projectId: string): Promise<boolean> {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar, projectId)
      .input('deletedAt', sql.DateTime2, new Date())
      .input('updatedAt', sql.DateTime2, new Date())
      .query("UPDATE dbo.Projects SET DeletedAt=@deletedAt, Status='archived', UpdatedAt=@updatedAt WHERE Id=@id");
    return (result.rowsAffected[0] || 0) > 0;
  }

  // --- SHARES ---
  public async getShareByToken(token: string): Promise<ShareLink | undefined> {
    const pool = await getPool();
    const { recordset } = await pool.request()
      .input('token', sql.NVarChar, token)
      .query('SELECT * FROM dbo.ShareLinks WHERE Token = @token AND IsActive = 1');
    return recordset[0] ? this.rowToShare(recordset[0]) : undefined;
  }

  private rowToShare(row: any): ShareLink {
    return {
      id: row.Id,
      projectId: row.ProjectId,
      projectName: row.ProjectName,
      createdBy: row.CreatedBy,
      creatorName: row.CreatorName,
      token: row.Token,
      tokenHash: row.TokenHash,
      isActive: !!row.IsActive,
      accessCount: row.AccessCount,
      expiresAt: row.ExpiresAt ? toIso(row.ExpiresAt) : undefined,
      createdAt: toIso(row.CreatedAt),
      revokedAt: row.RevokedAt ? toIso(row.RevokedAt) : null
    };
  }

  public async saveShare(share: ShareLink): Promise<void> {
    const pool = await getPool();
    const existing = await pool.request().input('id', sql.NVarChar, share.id).query('SELECT Id FROM dbo.ShareLinks WHERE Id = @id');

    const request = pool.request()
      .input('id', sql.NVarChar, share.id)
      .input('projectId', sql.NVarChar, share.projectId)
      .input('projectName', sql.NVarChar, share.projectName)
      .input('createdBy', sql.NVarChar, share.createdBy)
      .input('creatorName', sql.NVarChar, share.creatorName)
      .input('token', sql.NVarChar, share.token)
      .input('tokenHash', sql.NVarChar, share.tokenHash)
      .input('isActive', sql.Bit, share.isActive)
      .input('accessCount', sql.Int, share.accessCount || 0)
      .input('revokedAt', sql.DateTime2, share.revokedAt ? new Date(share.revokedAt) : null);

    if (existing.recordset.length > 0) {
      await request.query(`
        UPDATE dbo.ShareLinks SET ProjectId=@projectId, ProjectName=@projectName, CreatedBy=@createdBy,
          CreatorName=@creatorName, Token=@token, TokenHash=@tokenHash, IsActive=@isActive,
          AccessCount=@accessCount, RevokedAt=@revokedAt
        WHERE Id=@id
      `);
    } else {
      await request.input('createdAt', sql.DateTime2, share.createdAt ? new Date(share.createdAt) : new Date()).query(`
        INSERT INTO dbo.ShareLinks (Id, ProjectId, ProjectName, CreatedBy, CreatorName, Token, TokenHash, IsActive, AccessCount, CreatedAt, RevokedAt)
        VALUES (@id, @projectId, @projectName, @createdBy, @creatorName, @token, @tokenHash, @isActive, @accessCount, @createdAt, @revokedAt)
      `);
    }
  }

  public async incrementShareVisits(token: string): Promise<void> {
    const pool = await getPool();
    await pool.request().input('token', sql.NVarChar, token).query('UPDATE dbo.ShareLinks SET AccessCount = AccessCount + 1 WHERE Token = @token');
  }

  // --- AUDIT LOGS ---
  public async logAudit(entry: {
    userId: string;
    userName: string;
    userEmail?: string;
    action: AuditLog['action'];
    entityType?: AuditLog['entityType'];
    entityId?: string;
    status: AuditLog['status'];
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const pool = await getPool();
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, entry.userId)
      .input('userName', sql.NVarChar, entry.userName)
      .input('userEmail', sql.NVarChar, entry.userEmail || null)
      .input('action', sql.NVarChar, entry.action)
      .input('entityType', sql.NVarChar, entry.entityType || 'project')
      .input('entityId', sql.NVarChar, entry.entityId || 'general')
      .input('status', sql.NVarChar, entry.status)
      .input('metadata', sql.NVarChar, JSON.stringify(entry.metadata || {}))
      .input('createdAt', sql.DateTime2, new Date())
      .query(`
        INSERT INTO dbo.AuditLogs (Id, UserId, UserName, UserEmail, Action, EntityType, EntityId, Status, Metadata, CreatedAt)
        VALUES (@id, @userId, @userName, @userEmail, @action, @entityType, @entityId, @status, @metadata, @createdAt)
      `);
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    const pool = await getPool();
    const { recordset } = await pool.request().query('SELECT TOP 500 * FROM dbo.AuditLogs ORDER BY CreatedAt DESC');
    return recordset.map((row: any) => ({
      id: row.Id,
      userId: row.UserId,
      userName: row.UserName,
      userEmail: row.UserEmail || '',
      action: row.Action,
      entityType: row.EntityType,
      entityId: row.EntityId,
      status: row.Status,
      metadata: row.Metadata ? JSON.parse(row.Metadata) : {},
      createdAt: toIso(row.CreatedAt)
    }));
  }

  // --- EXPORTS ---
  public async saveExport(record: ExportRecord): Promise<void> {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.NVarChar, record.id)
      .input('projectId', sql.NVarChar, record.projectId)
      .input('projectName', sql.NVarChar, record.projectName)
      .input('userId', sql.NVarChar, record.userId)
      .input('format', sql.NVarChar, record.format)
      .input('resolution', sql.NVarChar, record.resolution)
      .input('status', sql.NVarChar, record.status)
      .input('fileUrl', sql.NVarChar, record.fileUrl || null)
      .input('fileSizeMb', sql.Float, record.fileSizeMb ?? null)
      .input('cameraPreset', sql.NVarChar, record.cameraPreset)
      .input('lightingPreset', sql.NVarChar, record.lightingPreset)
      .input('createdAt', sql.DateTime2, record.createdAt ? new Date(record.createdAt) : new Date())
      .query(`
        INSERT INTO dbo.ExportRecords (Id, ProjectId, ProjectName, UserId, Format, Resolution, Status, FileUrl, FileSizeMb, CameraPreset, LightingPreset, CreatedAt)
        VALUES (@id, @projectId, @projectName, @userId, @format, @resolution, @status, @fileUrl, @fileSizeMb, @cameraPreset, @lightingPreset, @createdAt)
      `);
  }

  public async getExports(userId?: string): Promise<ExportRecord[]> {
    const pool = await getPool();
    const request = pool.request();
    let query = 'SELECT * FROM dbo.ExportRecords';
    if (userId) {
      request.input('userId', sql.NVarChar, userId);
      query += ' WHERE UserId = @userId';
    }
    query += ' ORDER BY CreatedAt DESC';
    const { recordset } = await request.query(query);
    return recordset.map((row: any) => ({
      id: row.Id,
      projectId: row.ProjectId,
      projectName: row.ProjectName,
      userId: row.UserId,
      format: row.Format,
      resolution: row.Resolution,
      status: row.Status,
      fileUrl: row.FileUrl || '',
      fileSizeMb: row.FileSizeMb ?? undefined,
      cameraPreset: row.CameraPreset,
      lightingPreset: row.LightingPreset,
      createdAt: toIso(row.CreatedAt)
    }));
  }

  // --- AI GENERATIONS COUNTER ---
  public async incrementAIGenerations(): Promise<void> {
    const pool = await getPool();
    await pool.request().query(`
      MERGE dbo.AppCounters AS target
      USING (SELECT 'aiGenerationsCount' AS Name) AS src ON target.Name = src.Name
      WHEN MATCHED THEN UPDATE SET Value = Value + 1
      WHEN NOT MATCHED THEN INSERT (Name, Value) VALUES ('aiGenerationsCount', 1);
    `);
  }

  private async getCounter(pool: sql.ConnectionPool, name: string, fallback: number): Promise<number> {
    const { recordset } = await pool.request().input('name', sql.NVarChar, name).query('SELECT Value FROM dbo.AppCounters WHERE Name = @name');
    return recordset[0]?.Value ?? fallback;
  }

  // --- ADMIN METRICS ---
  public async getAdminMetrics(): Promise<AdminMetrics> {
    const pool = await getPool();

    const [users, projects, shares, exportsAgg, aiGenerationsCount] = await Promise.all([
      pool.request().query(`
        SELECT COUNT(*) AS total,
          SUM(CASE WHEN Status = 'ACTIVE' THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN EmailVerified = 1 THEN 1 ELSE 0 END) AS verified
        FROM dbo.Users
      `),
      pool.request().query(`
        SELECT COUNT(*) AS total,
          SUM(CASE WHEN DeletedAt IS NULL THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN DeletedAt IS NOT NULL THEN 1 ELSE 0 END) AS deleted
        FROM dbo.Projects
      `),
      pool.request().query(`
        SELECT COUNT(*) AS totalCreated,
          SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) AS revoked,
          ISNULL(SUM(AccessCount), 0) AS totalViews
        FROM dbo.ShareLinks
      `),
      pool.request().query(`
        SELECT Format, Resolution, COUNT(*) AS cnt FROM dbo.ExportRecords GROUP BY Format, Resolution
      `),
      this.getCounter(pool, 'aiGenerationsCount', 12)
    ]);

    const byFormat: Record<ExportFormat, number> = { PNG: 0, JPG: 0, WEBP: 0 };
    const byResolution: Record<ExportResolution, number> = { '1080p': 0, '2K': 0, '4K': 0 };
    let totalExports = 0;
    for (const row of exportsAgg.recordset) {
      totalExports += row.cnt;
      if (byFormat[row.Format as ExportFormat] !== undefined) byFormat[row.Format as ExportFormat] += row.cnt;
      if (byResolution[row.Resolution as ExportResolution] !== undefined) byResolution[row.Resolution as ExportResolution] += row.cnt;
    }

    const u = users.recordset[0];
    const p = projects.recordset[0];
    const s = shares.recordset[0];

    return {
      users: { total: u.total, active: u.active || 0, verified: u.verified || 0, newToday: 1 },
      projects: { total: p.total, active: p.active || 0, deleted: p.deleted || 0 },
      aiGenerations: {
        total: aiGenerationsCount,
        successful: Math.floor(aiGenerationsCount * 0.9),
        failed: Math.ceil(aiGenerationsCount * 0.08),
        timeouts: 0,
        averageDurationMs: 2400
      },
      exports: { total: totalExports, byFormat, byResolution },
      shares: { totalCreated: s.totalCreated, active: s.active || 0, revoked: s.revoked || 0, totalViews: s.totalViews || 0 }
    };
  }
}

export const serverDb = new ServerDatabase();
