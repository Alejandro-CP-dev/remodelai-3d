import { getPool, sql } from '../db/pool';
import { ShareLink } from '../../src/types';

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToShare(row: any): ShareLink {
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

export async function getShareByToken(token: string): Promise<ShareLink | undefined> {
  const pool = await getPool();
  const { recordset } = await pool.request()
    .input('token', sql.NVarChar, token)
    .query('SELECT * FROM dbo.ShareLinks WHERE Token = @token AND IsActive = 1');
  return recordset[0] ? rowToShare(recordset[0]) : undefined;
}

export async function saveShare(share: ShareLink): Promise<void> {
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

export async function incrementShareVisits(token: string): Promise<void> {
  const pool = await getPool();
  await pool.request().input('token', sql.NVarChar, token).query('UPDATE dbo.ShareLinks SET AccessCount = AccessCount + 1 WHERE Token = @token');
}
