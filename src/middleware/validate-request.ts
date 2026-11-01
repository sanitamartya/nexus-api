import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-error.js";

export const validateRequest = (schema: ZodType): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

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

    req.body = result.data;

    next();
  };
};
