import dotenv from 'dotenv';
import path from 'path';
import { createApp } from './server/app';

// Load GEMINI_API_KEY, DB_* etc. from .env.local (falls back to .env if present).
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const PORT = 3000;

createApp()
  .then(app => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[RemodelAI 3D Engine] Server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('[RemodelAI 3D Engine] Failed to start:', err);
    process.exit(1);
  });
