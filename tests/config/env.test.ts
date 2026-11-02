import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

describe("Environment configuration", () => {
  it("should start with a valid port", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "--input-type=module",
        "-e",
        `
          process.env.PORT = "4000";
          process.env.NODE_ENV = "development";

          const { env } = await import("./src/config/env.ts");

          if (env.PORT !== 4000) {
            process.exit(1);
          }
        `,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(0);
  });

  it("should reject an invalid port", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "--input-type=module",
        "-e",
        `
          process.env.PORT = "hello";
          process.env.NODE_ENV = "development";

          await import("./src/config/env.ts");
        `,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Invalid environment configuration:");
  });
});
