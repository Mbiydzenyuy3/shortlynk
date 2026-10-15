import http from 'node:http';
import app from './app.js';
import { config } from './config/index.js';
import prisma from './shared/prisma.js';
import logger from './shared/utils/logger.js';

const server = http.createServer(app);

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Gracefully shutting down');

  await new Promise<void>((resolve) => {
    server.close(() => {
      logger.info('HTTP server closed');
      resolve();
    });
  });

  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (err) {
    logger.error({ err }, 'Error disconnecting from database');
  }

  process.exit(0);
}

for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM']) {
  process.on(signal, () => gracefulShutdown(signal));
}

server.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Server started');
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') throw error;

  const bind = `Port ${config.PORT}`;
  switch (error.code) {
    case 'EACCES':
      logger.fatal(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.fatal(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});
