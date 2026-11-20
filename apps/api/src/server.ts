import http from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { closeDbPool } from './shared/db/pool.js';
import { createGracefulShutdown } from './shared/shutdown.js';

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`[SIRIS API] Server berjalan pada http://localhost:${env.PORT}`);
  console.log(`[SIRIS API] Environment: ${env.NODE_ENV} | Timezone: ${env.APP_TIMEZONE}`);
  console.log(`[SIRIS API] Health endpoint: http://localhost:${env.PORT}/health`);
  console.log(`[SIRIS API] API v1 base: http://localhost:${env.PORT}${env.API_PREFIX}`);
});

const gracefulShutdown = createGracefulShutdown(server, closeDbPool, {
  exit: (code) => { process.exit(code); },
  log: (message) => { console.log(message); },
  error: (message) => { console.error(message); },
});
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
