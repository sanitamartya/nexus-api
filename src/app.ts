import express from "express";

import { AppError } from "./errors/app-error.js";
import { Prisma } from "./generated/prisma/client.js";
import { prisma } from "./config/database.js";
import { errorHandler } from "./middleware/error-handler.js";
import { validateRequest } from "./middleware/validate-request.js";
import { createUserSchema } from "./schemas/user.schema.js";
import { successResponse } from "./utils/api-response.js";

const app = express();

app.use(express.json());
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Nexus API is healthy",
  });
});

app.post(
  "/api/v1/users",
  validateRequest(createUserSchema),
  async (req, res) => {
    try {
      const { name, email } = req.body;

      const user = await prisma.user.create({
        data: {
          name,
          email,
        },
      });

      res.status(201).json(successResponse("User created successfully.", user));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          "A user with this email already exists.",
          409,
          "USER_ALREADY_EXISTS",
        );
      }

      throw error;
    }
  },
);

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
