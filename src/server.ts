import app from "./app.js";
import { env } from "./config/env.js";
import { startHttpServer, shutdownHttpServer } from "./utils/http-server.js";

const server = startHttpServer(app, env.PORT);

let isShuttingDown = false;

const handleShutdown = (signal: string): void => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  void shutdownHttpServer(server, signal).catch((error: unknown) => {
    console.error("Error during server shutdown:", error);
    process.exitCode = 1;
  });
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
