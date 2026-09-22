import { getPool, sql } from '../db/pool';
import { AuditLog } from '../../src/types';

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function logAudit(entry: {
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

export async function getAuditLogs(): Promise<AuditLog[]> {
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
