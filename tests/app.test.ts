import express from "express";
import { errorHandler } from "../src/middleware/error-handler.js";

import { describe, expect, it } from "vitest";

import request from "supertest";
import app from "../src/app.js";

describe("GET /health", () => {
  it("should return 200 and healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "ok",
      message: "Nexus API is healthy",
    });
  });
});

describe("POST /api/v1/users", () => {
  it("should reject malformed JSON", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .set("Content-Type", "application/json")
      .send('{"name":"Alex","email":}');

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON.",
      },
    });
  });

  it("should accept valid user data", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "Alex",
      email: "alex@example.com",
    });

    expect(response.status).toBe(201);

    expect(response.body.data).toEqual({
      name: "Alex",
      email: "alex@example.com",
    });
  });

  it("should reject an empty name", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "",
      email: "alex@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject an invalid email", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "Alex",
      email: "invalid-email",
    });

    expect(response.status).toBe(400);

    expect(response.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
    });

    expect(response.body.error.details).toContainEqual({
      field: "email",
      message: "Please provide a valid email address.",
    });
  });

  it("should reject unexpected fields", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "Alex",
      email: "alex@example.com",
      isAdmin: true,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("Error handling", () => {
  it("should return 404 for an unknown route", async () => {
    const response = await request(app).get("/unknown");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "The requested resource was not found.",
      },
    });
  });

  it("should return a generic 500 response for unexpected errors", async () => {
    // Create an isolated Express app for testing error handling.
    const errorTestApp = express();

    // Create a route that deliberately throws an unexpected error.
    errorTestApp.get("/trigger-error", () => {
      throw new Error("Internal database connection details");
    });

    // Register the error handler.
    errorTestApp.use(errorHandler);

    // Make the request.
    const response = await request(errorTestApp).get("/trigger-error");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    });

    // Internal error details must not leak to the API client.
    expect(JSON.stringify(response.body)).not.toContain(
      "Internal database connection details",
    );
  });
});
