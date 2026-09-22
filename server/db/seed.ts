import sql from 'mssql';
import { hashPassword, generateSalt } from './crypto';

// Reproduces the curated demo content the app used to hardcode in
// server/db.ts's getInitialDatabaseData(), now as real rows. Runs once,
// only when the Users table is empty, so re-running `npm run db:setup`
// against an already-seeded database is a no-op.
export async function seedIfEmpty(pool: sql.ConnectionPool): Promise<void> {
  const { recordset } = await pool.request().query('SELECT COUNT(*) AS count FROM dbo.Users');
  if (recordset[0].count > 0) {
    console.log('[seed] La base de datos ya tiene datos, se omite el seed.');
    return;
  }

  console.log('[seed] Sembrando datos de demo...');
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const adminSalt = generateSalt();
    const adminHash = hashPassword('Admin2026!', adminSalt);
    const demoSalt = generateSalt();
    const demoHash = hashPassword('Demo2026!', demoSalt);

    const now = new Date();

    await new sql.Request(transaction)
      .input('id', sql.NVarChar, 'usr-admin-01')
      .input('name', sql.NVarChar, 'Admin Supervisor')
      .input('email', sql.NVarChar, 'admin@remodelai.com')
      .input('role', sql.NVarChar, 'admin')
      .input('emailVerified', sql.Bit, true)
      .input('status', sql.NVarChar, 'ACTIVE')
      .input('passwordHash', sql.NVarChar, adminHash)
      .input('salt', sql.NVarChar, adminSalt)
      .input('avatarUrl', sql.NVarChar, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80')
      .input('createdAt', sql.DateTime2, new Date('2026-08-01T08:00:00.000Z'))
      .input('updatedAt', sql.DateTime2, now)
      .input('lastLoginAt', sql.DateTime2, now)
      .query(`
        INSERT INTO dbo.Users (Id, Name, Email, Role, EmailVerified, Status, PasswordHash, Salt, AvatarUrl, CreatedAt, UpdatedAt, LastLoginAt)
        VALUES (@id, @name, @email, @role, @emailVerified, @status, @passwordHash, @salt, @avatarUrl, @createdAt, @updatedAt, @lastLoginAt)
      `);

    await new sql.Request(transaction)
      .input('id', sql.NVarChar, 'usr-default-02')
      .input('name', sql.NVarChar, 'Alejandro Carrillo')
      .input('email', sql.NVarChar, 'jalejandrocp29@gmail.com')
      .input('role', sql.NVarChar, 'user')
      .input('emailVerified', sql.Bit, true)
      .input('status', sql.NVarChar, 'ACTIVE')
      .input('passwordHash', sql.NVarChar, demoHash)
      .input('salt', sql.NVarChar, demoSalt)
      .input('avatarUrl', sql.NVarChar, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80')
      .input('createdAt', sql.DateTime2, new Date('2026-08-15T09:30:00.000Z'))
      .input('updatedAt', sql.DateTime2, now)
      .input('lastLoginAt', sql.DateTime2, now)
      .query(`
        INSERT INTO dbo.Users (Id, Name, Email, Role, EmailVerified, Status, PasswordHash, Salt, AvatarUrl, CreatedAt, UpdatedAt, LastLoginAt)
        VALUES (@id, @name, @email, @role, @emailVerified, @status, @passwordHash, @salt, @avatarUrl, @createdAt, @updatedAt, @lastLoginAt)
      `);

    const projectId = 'proj-dormitorio-master-01';
    const sceneId = 'scn-dormitorio-master-01';

    await new sql.Request(transaction)
      .input('id', sql.NVarChar, projectId)
      .input('ownerId', sql.NVarChar, 'usr-default-02')
      .input('ownerName', sql.NVarChar, 'Alejandro Carrillo')
      .input('name', sql.NVarChar, 'Dormitorio Suite Principal 3D')
      .input('description', sql.NVarChar, 'Espacio maestro optimizado con acabados cálidos en madera, ventilación natural y paleta escandinava.')
      .input('status', sql.NVarChar, 'active')
      .input('version', sql.Int, 1)
      .input('thumbnailUrl', sql.NVarChar, 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&fit=crop&q=80')
      .input('createdAt', sql.DateTime2, new Date('2026-08-20T11:00:00.000Z'))
      .input('updatedAt', sql.DateTime2, now)
      .query(`
        INSERT INTO dbo.Projects (Id, OwnerId, OwnerName, Name, Description, Status, Version, ThumbnailUrl, CreatedAt, UpdatedAt)
        VALUES (@id, @ownerId, @ownerName, @name, @description, @status, @version, @thumbnailUrl, @createdAt, @updatedAt)
      `);

    await new sql.Request(transaction)
      .input('id', sql.NVarChar, sceneId)
      .input('projectId', sql.NVarChar, projectId)
      .input('version', sql.Int, 1)
      .input('width', sql.Float, 4.8)
      .input('length', sql.Float, 4.0)
      .input('height', sql.Float, 2.7)
      .input('wallMaterial', sql.NVarChar, 'pintura')
      .input('wallColor', sql.NVarChar, '#f1f5f9')
      .input('floorMaterial', sql.NVarChar, 'madera')
      .input('floorColor', sql.NVarChar, '#a16207')
      .input('ceilingColor', sql.NVarChar, '#ffffff')
      .input('ceilingVisible', sql.Bit, false)
      .input('lightingPreset', sql.NVarChar, 'dia')
      .input('createdAt', sql.DateTime2, new Date('2026-08-20T11:00:00.000Z'))
      .input('updatedAt', sql.DateTime2, now)
      .query(`
        INSERT INTO dbo.Scenes (Id, ProjectId, Version, Width, Length, Height, WallMaterial, WallColor, FloorMaterial, FloorColor, CeilingColor, CeilingVisible, LightingPreset, CreatedAt, UpdatedAt)
        VALUES (@id, @projectId, @version, @width, @length, @height, @wallMaterial, @wallColor, @floorMaterial, @floorColor, @ceilingColor, @ceilingVisible, @lightingPreset, @createdAt, @updatedAt)
      `);

    const objects = [
      { id: 'obj-cama-king', name: 'Cama King Size', category: 'muebles', type: 'bed', pos: [0, 0.35, -0.6], rot: [0, 0, 0], scale: [2.0, 0.7, 2.1], color: '#475569', material: 'tela_lino' },
      { id: 'obj-mesa-noche-izq', name: 'Mesa de Noche Izquierda', category: 'muebles', type: 'nightstand', pos: [-1.45, 0.25, -0.6], rot: [0, 0, 0], scale: [0.5, 0.5, 0.45], color: '#78350f', material: 'madera' },
      { id: 'obj-mesa-noche-der', name: 'Mesa de Noche Derecha', category: 'muebles', type: 'nightstand', pos: [1.45, 0.25, -0.6], rot: [0, 0, 0], scale: [0.5, 0.5, 0.45], color: '#78350f', material: 'madera' },
      { id: 'obj-lampara-techo', name: 'Lámpara Colgante Nórdica', category: 'decoracion', type: 'ceiling_lamp', pos: [0, 2.3, 0], rot: [0, 0, 0], scale: [0.6, 0.6, 0.6], color: '#f59e0b', material: 'metal_cepillado' },
      { id: 'obj-planta-monstera', name: 'Monstera Deliciosa en Maceta', category: 'decoracion', type: 'plant', pos: [2.0, 0.45, 1.2], rot: [0, 45, 0], scale: [0.7, 0.9, 0.7], color: '#16a34a', material: 'ceramica' },
      { id: 'obj-puerta-acceso', name: 'Puerta Principal de Paso', category: 'estructura', type: 'door', pos: [-1.2, 1.05, 1.95], rot: [0, 180, 0], scale: [0.9, 2.1, 0.1], color: '#334155', material: 'madera' },
      { id: 'obj-ventanal-panoramico', name: 'Ventanal Panorámico', category: 'estructura', type: 'window', pos: [2.35, 1.35, 0], rot: [0, -90, 0], scale: [1.8, 1.4, 0.1], color: '#0ea5e9', material: 'cristal_aluminio' }
    ];

    for (const obj of objects) {
      await new sql.Request(transaction)
        .input('id', sql.NVarChar, obj.id)
        .input('sceneId', sql.NVarChar, sceneId)
        .input('name', sql.NVarChar, obj.name)
        .input('category', sql.NVarChar, obj.category)
        .input('type', sql.NVarChar, obj.type)
        .input('posX', sql.Float, obj.pos[0]).input('posY', sql.Float, obj.pos[1]).input('posZ', sql.Float, obj.pos[2])
        .input('rotX', sql.Float, obj.rot[0]).input('rotY', sql.Float, obj.rot[1]).input('rotZ', sql.Float, obj.rot[2])
        .input('scaleX', sql.Float, obj.scale[0]).input('scaleY', sql.Float, obj.scale[1]).input('scaleZ', sql.Float, obj.scale[2])
        .input('color', sql.NVarChar, obj.color)
        .input('material', sql.NVarChar, obj.material)
        .input('visible', sql.Bit, true)
        .query(`
          INSERT INTO dbo.SceneObjects (Id, SceneId, Name, Category, Type, PosX, PosY, PosZ, RotX, RotY, RotZ, ScaleX, ScaleY, ScaleZ, Color, Material, Visible)
          VALUES (@id, @sceneId, @name, @category, @type, @posX, @posY, @posZ, @rotX, @rotY, @rotZ, @scaleX, @scaleY, @scaleZ, @color, @material, @visible)
        `);
    }

    await new sql.Request(transaction)
      .input('id', sql.NVarChar, 'shr-demo-01')
      .input('projectId', sql.NVarChar, projectId)
      .input('projectName', sql.NVarChar, 'Dormitorio Suite Principal 3D')
      .input('createdBy', sql.NVarChar, 'usr-default-02')
      .input('creatorName', sql.NVarChar, 'Alejandro Carrillo')
      .input('token', sql.NVarChar, 'espacio-demo-suite')
      .input('tokenHash', sql.NVarChar, 'hash-espacio-demo-suite')
      .input('isActive', sql.Bit, true)
      .input('accessCount', sql.Int, 14)
      .input('createdAt', sql.DateTime2, new Date('2026-08-21T10:00:00.000Z'))
      .query(`
        INSERT INTO dbo.ShareLinks (Id, ProjectId, ProjectName, CreatedBy, CreatorName, Token, TokenHash, IsActive, AccessCount, CreatedAt)
        VALUES (@id, @projectId, @projectName, @createdBy, @creatorName, @token, @tokenHash, @isActive, @accessCount, @createdAt)
      `);

    const auditLogs = [
      { id: 'log-seed-1', action: 'project_create', entityType: 'project', entityId: projectId, metadata: { name: 'Dormitorio Suite Principal 3D' }, createdAt: '2026-08-20T11:00:00.000Z' },
      { id: 'log-seed-2', action: 'share_create', entityType: 'share', entityId: 'shr-demo-01', metadata: { token: 'espacio-demo-suite' }, createdAt: '2026-08-21T10:00:00.000Z' }
    ];
    for (const log of auditLogs) {
      await new sql.Request(transaction)
        .input('id', sql.NVarChar, log.id)
        .input('userId', sql.NVarChar, 'usr-default-02')
        .input('userName', sql.NVarChar, 'Alejandro Carrillo')
        .input('userEmail', sql.NVarChar, 'jalejandrocp29@gmail.com')
        .input('action', sql.NVarChar, log.action)
        .input('entityType', sql.NVarChar, log.entityType)
        .input('entityId', sql.NVarChar, log.entityId)
        .input('status', sql.NVarChar, 'SUCCESS')
        .input('metadata', sql.NVarChar, JSON.stringify(log.metadata))
        .input('createdAt', sql.DateTime2, new Date(log.createdAt))
        .query(`
          INSERT INTO dbo.AuditLogs (Id, UserId, UserName, UserEmail, Action, EntityType, EntityId, Status, Metadata, CreatedAt)
          VALUES (@id, @userId, @userName, @userEmail, @action, @entityType, @entityId, @status, @metadata, @createdAt)
        `);
    }

    await new sql.Request(transaction)
      .input('name', sql.NVarChar, 'aiGenerationsCount')
      .input('value', sql.Int, 12)
      .query('INSERT INTO dbo.AppCounters (Name, Value) VALUES (@name, @value)');

    await transaction.commit();
    console.log('[seed] Listo: usuarios admin/demo, proyecto "Dormitorio Suite Principal 3D" con 7 objetos, share link y logs iniciales.');
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
