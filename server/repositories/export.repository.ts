import { getPool, sql } from '../db/pool';
import { ExportRecord } from '../../src/types';

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function saveExport(record: ExportRecord): Promise<void> {
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

export async function getExports(userId?: string): Promise<ExportRecord[]> {
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
