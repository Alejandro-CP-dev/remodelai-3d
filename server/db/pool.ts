import sql from 'mssql';

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function getConfig(): sql.config {
  const missing = ['DB_SERVER', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno de base de datos: ${missing.join(', ')}. ` +
      `Corre "npm run db:setup" o revisa .env.local.`
    );
  }

  return {
    server: process.env.DB_SERVER!,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1433,
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

// Singleton connection pool shared by every request — created lazily on first use
// and reused afterwards, per the mssql library's recommended pattern.
export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(getConfig()).connect();
    poolPromise.catch(() => {
      // Allow a retry on the next call instead of permanently caching a failed connection.
      poolPromise = null;
    });
  }
  return poolPromise;
}

export { sql };
