import express from "express";

import { errorHandler } from "./middleware/error-handler.js";
import { createUserSchema } from "./schemas/user.schema.js";
import { validateRequest } from "./middleware/validate-request.js";

const app = express();
app.use(express.json());
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Nexus API is healthy",
  });
});

app.post("/api/v1/users", validateRequest(createUserSchema), (req, res) => {
  const { name, email } = req.body;

  res.status(201).json({
    success: true,
    message: "User data received successfully.",
    data: {
      name,
      email,
    },
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
