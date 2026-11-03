import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { request } from "node:http";

import {
  startHttpServer,
  shutdownHttpServer,
} from "../../src/utils/http-server.js";

import type { Server } from "node:http";

describe("HTTP server lifecycle", () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    server = undefined;
  });

  it("should start an HTTP server", async () => {
    const app = express();

    server = startHttpServer(app, 0);

    await new Promise<void>((resolve) => {
      server!.once("listening", resolve);
    });

    expect(server.listening).toBe(true);
  });

  it("should gracefully close the HTTP server", async () => {
    const app = express();

    server = startHttpServer(app, 0);

    await new Promise<void>((resolve) => {
      server!.once("listening", resolve);
    });

    await shutdownHttpServer(server, "TEST");

    expect(server.listening).toBe(false);
  });

  it("should finish an active request before shutting down", async () => {
    let requestStarted!: () => void;

    const requestStartedPromise = new Promise<void>((resolve) => {
      requestStarted = resolve;
    });

    const app = express();

    app.get("/slow", (_req, res) => {
      requestStarted();

      setTimeout(() => {
        res.status(200).json({
          message: "Request completed.",
        });
      }, 200);
    });

    server = startHttpServer(app, 0);

    await new Promise<void>((resolve) => {
      server!.once("listening", resolve);
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Unable to determine server port.");
    }

    const responsePromise = new Promise<string>((resolve, reject) => {
      const clientRequest = request(
        {
          hostname: "127.0.0.1",
          port: address.port,
          path: "/slow",
        },
        (response) => {
          let body = "";

          response.setEncoding("utf8");
          response.on("data", (chunk: string) => {
            body += chunk;
          });
          response.on("end", () => resolve(body));
        },
      );

      clientRequest.on("error", reject);
      clientRequest.end();
    });

    await requestStartedPromise;

    const shutdownPromise = shutdownHttpServer(server, "TEST");

    const responseBody = await responsePromise;

    await shutdownPromise;

    expect(JSON.parse(responseBody)).toEqual({
      message: "Request completed.",
    });

    expect(server.listening).toBe(false);
  });

  it("should force-close active connections after shutdown timeout", async () => {
    let requestStarted!: () => void;

    const requestStartedPromise = new Promise<void>((resolve) => {
      requestStarted = resolve;
    });

    const app = express();

    app.get("/never-completes", (_req, _res) => {
      requestStarted();
      // Intentionally never send a response.
    });

    server = startHttpServer(app, 0);

    await new Promise<void>((resolve) => {
      server!.once("listening", resolve);
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Unable to determine server port.");
    }

    const responsePromise = new Promise<void>((resolve, reject) => {
      const clientRequest = request(
        {
          hostname: "127.0.0.1",
          port: address.port,
          path: "/never-completes",
        },
        (response) => {
          response.resume();
          response.on("end", resolve);
        },
      );

      clientRequest.on("error", reject);
      clientRequest.end();
    });

    await requestStartedPromise;

    const shutdownPromise = shutdownHttpServer(server, "TEST", 100);

    await expect(shutdownPromise).rejects.toThrow(
      "Graceful shutdown timed out.",
    );

    await expect(responsePromise).rejects.toBeDefined();

    expect(server.listening).toBe(false);
  });
});
