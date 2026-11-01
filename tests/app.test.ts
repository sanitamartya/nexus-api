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
