import crypto from 'crypto';
import { getPool, sql } from '../db/pool';
import { hashPassword, generateSalt } from '../db/crypto';
import { User } from '../../src/types';

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

export async function getUsers(): Promise<ServerUser[]> {
  const pool = await getPool();
  const { recordset } = await pool.request().query('SELECT * FROM dbo.Users ORDER BY CreatedAt');
  return recordset.map(rowToUser);
}

export async function findUserById(id: string): Promise<ServerUser | undefined> {
  const pool = await getPool();
  const { recordset } = await pool.request().input('id', sql.NVarChar, id).query('SELECT * FROM dbo.Users WHERE Id = @id');
  return recordset[0] ? rowToUser(recordset[0]) : undefined;
}

export async function findUserByEmail(email: string): Promise<ServerUser | undefined> {
  const pool = await getPool();
  const clean = email.toLowerCase().trim();
  const { recordset } = await pool.request().input('email', sql.NVarChar, clean).query('SELECT * FROM dbo.Users WHERE LOWER(Email) = @email');
  return recordset[0] ? rowToUser(recordset[0]) : undefined;
}

export async function createUser(params: {
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

  return (await findUserById(id))!;
}

export async function updateUser(user: ServerUser): Promise<void> {
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
export async function createSession(userId: string): Promise<string> {
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

export async function getSessionUser(token: string): Promise<ServerUser | null> {
  const pool = await getPool();
  const { recordset } = await pool.request().input('token', sql.NVarChar, token).query('SELECT * FROM dbo.Sessions WHERE Token = @token');
  const session = recordset[0];
  if (!session) return null;

  if (new Date(session.ExpiresAt) < new Date()) {
    await removeSession(token);
    return null;
  }

  return (await findUserById(session.UserId)) || null;
}

export async function removeSession(token: string): Promise<void> {
  const pool = await getPool();
  await pool.request().input('token', sql.NVarChar, token).query('DELETE FROM dbo.Sessions WHERE Token = @token');
}
