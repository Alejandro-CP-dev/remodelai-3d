import { getPool, sql } from '../db/pool';
import { Project, Scene, Object3DItem } from '../../src/types';

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
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

async function hydrateProjects(pool: sql.ConnectionPool, projectRows: any[]): Promise<Project[]> {
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

export async function getProjects(userId?: string, isAdmin: boolean = false): Promise<Project[]> {
  const pool = await getPool();
  const request = pool.request();
  let query = 'SELECT * FROM dbo.Projects WHERE DeletedAt IS NULL';
  if (!isAdmin && userId) {
    request.input('ownerId', sql.NVarChar, userId);
    query += ' AND OwnerId = @ownerId';
  }
  query += ' ORDER BY CreatedAt DESC';

  const { recordset } = await request.query(query);
  return hydrateProjects(pool, recordset);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const pool = await getPool();
  const { recordset } = await pool.request()
    .input('id', sql.NVarChar, id)
    .query('SELECT * FROM dbo.Projects WHERE Id = @id AND DeletedAt IS NULL');
  if (!recordset[0]) return undefined;
  const [project] = await hydrateProjects(pool, recordset);
  return project;
}

export async function saveProject(project: Project): Promise<void> {
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

export async function softDeleteProject(projectId: string): Promise<boolean> {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.NVarChar, projectId)
    .input('deletedAt', sql.DateTime2, new Date())
    .input('updatedAt', sql.DateTime2, new Date())
    .query("UPDATE dbo.Projects SET DeletedAt=@deletedAt, Status='archived', UpdatedAt=@updatedAt WHERE Id=@id");
  return (result.rowsAffected[0] || 0) > 0;
}
