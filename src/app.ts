import express from "express";

import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Nexus API is healthy",
  });
});

// 404 handler must come after all routes.
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "The requested resource was not found.",
    },
  });
});

// Error handler must be last.
app.use(errorHandler);

export default app;
