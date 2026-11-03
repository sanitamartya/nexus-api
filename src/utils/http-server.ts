import { createServer, type Server } from "node:http";
import type { Express } from "express";

export const startHttpServer = (app: Express, port: number): Server => {
  const server = createServer(app);

  server.listen(port, () => {
    console.log(`Nexus API server listening on port ${port}`);
  });

  return server;
};

export const shutdownHttpServer = (
  server: Server,
  signal: string,
  shutdownTimeout = 10_000,
): Promise<void> => {
  console.log(`${signal} received. Starting graceful shutdown...`);

  return new Promise((resolve, reject) => {
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;

      console.error("Graceful shutdown timed out. Closing active connections.");

      server.closeAllConnections();
    }, shutdownTimeout);

    timeout.unref();

    server.close((error) => {
      clearTimeout(timeout);

      if (error) {
        reject(error);
        return;
      }

      if (timedOut) {
        reject(new Error("Graceful shutdown timed out."));
        return;
      }

      console.log("HTTP server closed successfully.");
      resolve();
    });
  });
};
