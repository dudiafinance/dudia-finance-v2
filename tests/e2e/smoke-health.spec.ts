import { test, expect } from "@playwright/test";

test("health endpoint responds with status ok/degraded", async ({ request }) => {
  const response = await request.get("/api/health");
  expect([200, 503]).toContain(response.status());

  const body = await response.json();
  expect(body).toHaveProperty("status");
  expect(body).toHaveProperty("timestamp");
  expect(body).toHaveProperty("checks");
  expect(body.checks).toHaveProperty("db");
});
