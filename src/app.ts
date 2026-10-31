import express from "express";

const app = express();

// Hide Express technology information from response headers.
app.disable("x-powered-by");

// Health endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Nexus API is healthy",
  });
});

// Handle unknown routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "The requested resource was not found.",
    },
  });
});

export default app;
