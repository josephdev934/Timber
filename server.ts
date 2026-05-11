import { loadEnvConfig } from '@next/env';

// Load environment variables IMMEDIATELY before any other imports
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { socketServer } from './src/infrastructure/socket/socketServer';

/**
 * ==========================================
 * NEXT.JS CUSTOM NODE SERVER (SINGLE BRAIN)
 * ==========================================
 * Required to host Socket.IO and Next.js in the same process/runtime.
 * Ensures API routes and real-time logic share the same HTTP server.
 * ==========================================
 */

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // 1. Create the unified HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // 2. Initialize Socket.IO and attach to the HTTP server
  // This must happen BEFORE httpServer.listen()
  socketServer.init(httpServer);

  // 3. Start the server
  httpServer.listen(port, () => {
    console.log(`> [PID: ${process.pid}] Unified Server Ready on http://${hostname}:${port}`);
    console.log(`> [PID: ${process.pid}] Next.js + Socket.IO (One Brain) Initialized.`);
  });
}).catch((err) => {
  console.error('Next.js preparation failed:', err);
  process.exit(1);
});
