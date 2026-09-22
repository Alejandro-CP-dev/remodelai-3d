import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { getPool, sql } from './pool';
import { seedIfEmpty } from './seed';

const ENV_PATH = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: ENV_PATH });

const DEFAULTS = {
  DB_SERVER: 'localhost',
  DB_PORT: '1433',
  DB_NAME: 'RemodelAI3D',
  DB_USER: 'remodelai_app'
};

function upsertEnvVars(vars: Record<string, string>): void {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
  for (const [key, value] of Object.entries(vars)) {
    const line = `${key}="${value}"`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    if (pattern.test(content)) {
      content = content.replace(pattern, line);
    } else {
      content = content.trimEnd() + (content.trim() ? '\n' : '') + line + '\n';
    }
  }
  fs.writeFileSync(ENV_PATH, content, 'utf-8');
}

async function main() {
  const dbPassword = process.env.DB_PASSWORD || crypto.randomBytes(18).toString('base64').replace(/[^A-Za-z0-9]/g, '') + 'Aa1!';

  const envUpdates: Record<string, string> = { ...DEFAULTS, DB_PASSWORD: dbPassword };
  for (const key of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
    if (process.env[key]) envUpdates[key] = process.env[key]!;
  }

  console.log(`[db:setup] Aplicando esquema en ${envUpdates.DB_SERVER}:${envUpdates.DB_PORT}/${envUpdates.DB_NAME}...`);
  const schemaPath = path.resolve(process.cwd(), 'server/db/schema.sql');
  try {
    execFileSync(
      'sqlcmd',
      ['-S', `${envUpdates.DB_SERVER},${envUpdates.DB_PORT}`, '-E', '-v', `AppPassword=${dbPassword}`, '-i', schemaPath],
      { stdio: 'inherit' }
    );
  } catch (err) {
    console.error(
      '[db:setup] No se pudo ejecutar sqlcmd. Verifica que SQL Server esté escuchando en ' +
      `${envUpdates.DB_SERVER}:${envUpdates.DB_PORT} (TCP/IP habilitado) y que tu usuario de Windows ` +
      'tenga permisos de sysadmin en la instancia.'
    );
    throw err;
  }

  upsertEnvVars(envUpdates);
  for (const [key, value] of Object.entries(envUpdates)) {
    process.env[key] = value;
  }

  console.log('[db:setup] Esquema listo. Conectando con las credenciales de la app para sembrar datos...');
  const pool = await getPool();
  await seedIfEmpty(pool);
  await pool.close();
  console.log('[db:setup] Completo.');
}

main().catch(err => {
  console.error('[db:setup] Falló:', err.message || err);
  process.exit(1);
});
