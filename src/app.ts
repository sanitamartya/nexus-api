import express from "express";

import { errorHandler } from "./middleware/error-handler.js";
import { createUserSchema } from "./schemas/user.schema.js";
import { AppError } from "./errors/app-error.js";

const app = express();
app.use(express.json());
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Nexus API is healthy",
  });
});

app.post("/api/v1/users", (req, res, next) => {
  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    next(
      new AppError(
        "Request validation failed.",
        400,
        "VALIDATION_ERROR",
        details,
      ),
    );
    return;
  }
  const { name, email } = result.data;

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
