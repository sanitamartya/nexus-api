import { z } from "zod";

export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .max(100, "Name must not exceed 100 characters."),

    email: z
      .string()
      .trim()
      .email("Please provide a valid email address.")
      .max(254, "Email must not exceed 254 characters."),
  })
  .strict();
