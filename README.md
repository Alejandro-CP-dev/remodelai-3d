# RemodelAI 3D

Visualiza la remodelación de una habitación antes de ejecutarla en la realidad: convierte fotos y descripciones en lenguaje natural en escenas 3D interactivas (WebGL/Three.js), distribuye mobiliario con precisión métrica, exporta renders en alta resolución y comparte el resultado con clientes mediante enlaces públicos.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Three.js
- **Backend:** Express + TypeScript, servido por el mismo proceso que Vite en desarrollo (`server.ts`)
- **Base de datos:** SQL Server (esquema relacional, ver `server/db/schema.sql`)
- **IA:** Gemini (`@google/genai`), con un motor heurístico de respaldo si la API no está disponible

## Prerrequisitos

- **Node.js** 18 o superior
- **SQL Server** accesible localmente (probado con SQL Server Express) con:
  - **TCP/IP habilitado** en el protocolo de red de la instancia (el driver de Node no soporta named pipes/shared memory) — ver [Configurar SQL Server](#configurar-sql-server) si no lo tienes.
  - Autenticación mixta habilitada (login SQL, no solo Windows).
- **sqlcmd** disponible en el `PATH` (se instala junto con las herramientas de cliente de SQL Server / SSMS).
- Una **API key de Gemini** (opcional): sin ella, la generación con IA usa automáticamente un motor heurístico local en vez de la API real.

## Puesta en marcha

1. Instala dependencias:
   ```
   npm install
   ```

2. Crea `.env.local` a partir de `.env.example` y complétalo:
   ```
   cp .env.example .env.local
   ```
   Como mínimo necesitas `GEMINI_API_KEY` (opcional, ver arriba). Las variables `DB_*` las completa automáticamente el siguiente paso.

3. Provisiona la base de datos (crea la BD si no existe, un login dedicado `remodelai_app`, el esquema completo y datos de demo):
   ```
   npm run db:setup
   ```
   Este script corre con tu sesión de Windows (necesita permisos para crear logins/bases en la instancia) y escribe las credenciales generadas para la app en `.env.local`. Es seguro volver a correrlo — no duplica datos si ya existen.

4. Levanta la app en modo desarrollo:
   ```
   npm run dev
   ```
   Abre http://localhost:3000

### Cuentas de prueba

Sembradas por `npm run db:setup`:

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@remodelai.com` | `Admin2026!` |
| Usuario estándar | `jalejandrocp29@gmail.com` | `Demo2026!` |

También puedes cambiar de cuenta sin escribir contraseña desde el selector "Cuentas demo" en el modal de login, o desde el menú de usuario ya autenticado.

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `GEMINI_API_KEY` | No | Clave de la API de Gemini. Sin ella (o con el valor placeholder), la generación con IA usa el motor heurístico local. |
| `DB_SERVER` | Sí | Host de SQL Server. Default tras `db:setup`: `localhost`. |
| `DB_PORT` | Sí | Puerto TCP de SQL Server. Default: `1433`. |
| `DB_NAME` | Sí | Nombre de la base de datos. Default: `RemodelAI3D`. |
| `DB_USER` | Sí | Login SQL dedicado para la app. Default: `remodelai_app`. |
| `DB_PASSWORD` | Sí | Contraseña de ese login. Generada automáticamente por `db:setup`. |

`.env.local` está en `.gitignore` — nunca se sube al repositorio.

## Configurar SQL Server

Si `npm run db:setup` falla al conectar, lo más probable es que TCP/IP esté deshabilitado en tu instancia (viene así por defecto en SQL Server Express). Para habilitarlo (ejemplo con una instancia `SQLEXPRESS`, ajusta el nombre a la tuya):

1. Abre **PowerShell como Administrador**.
2. Corre:
   ```powershell
   $tcp = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp'
   Set-ItemProperty -Path $tcp -Name Enabled -Value 1
   Set-ItemProperty -Path "$tcp\IPAll" -Name TcpDynamicPorts -Value ''
   Set-ItemProperty -Path "$tcp\IPAll" -Name TcpPort -Value 1433
   Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force
   ```
   (El nombre exacto de la carpeta `MSSQL17.SQLEXPRESS` depende de tu versión/instancia — revisa `HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\` si no coincide.)
3. Confirma que el servidor tenga **autenticación mixta** habilitada (SQL Server Management Studio → clic derecho en el servidor → Propiedades → Seguridad → "SQL Server and Windows Authentication mode").
4. Vuelve a correr `npm run db:setup`.

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor Express + Vite (modo desarrollo, HMR) en `:3000`. |
| `npm run build` | Compila el frontend (Vite) y empaqueta el backend (esbuild) a `dist/`. |
| `npm start` | Sirve la build de producción ya generada. |
| `npm run db:setup` | Crea/actualiza el esquema de base de datos y siembra datos de demo. |
| `npm run lint` | Verifica tipos con `tsc --noEmit`. |
| `npm run clean` | Borra `dist/`. |

## Estructura del proyecto

```
server.ts              # Entry point del backend (Express + middleware de Vite en dev)
server/
  db.ts                 # Capa de acceso a datos (SQL Server, queries parametrizadas)
  db/
    pool.ts              # Connection pool singleton
    crypto.ts            # Hash de contraseñas (scrypt)
    schema.sql           # DDL: tablas, FKs, índices, login de la app
    seed.ts / setup.ts    # Aprovisionamiento inicial de la base de datos
  geminiService.ts        # Integración con Gemini + motor heurístico de respaldo

src/
  components/            # UI de React (landing, dashboard, editor 3D, modales)
  services/               # apiClient (HTTP al backend), storage (caché local), aiService
  types/                  # Tipos compartidos (User, Project, Scene, ...)
  data/                   # Catálogo estático de assets/muebles
```

## Producción

```
npm run build
npm start
```

En producción (`NODE_ENV=production`), el backend sirve los estáticos compilados de `dist/` en vez de usar el middleware de desarrollo de Vite.
