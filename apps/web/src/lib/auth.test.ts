import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { requireSyncSecret } from "./auth";

const SECRET = "test-secret";

const request = (authorization?: string) =>
  new Request("http://localhost/api/sync", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });

describe("requireSyncSecret", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows a request with the correct bearer token", () => {
    expect(requireSyncSecret(request(`Bearer ${SECRET}`))).toBeNull();
  });

  it("rejects a request with no Authorization header", () => {
    expect(requireSyncSecret(request())?.status).toBe(401);
  });

  it("rejects a wrong secret of the same length", () => {
    expect(requireSyncSecret(request("Bearer test-secreX"))?.status).toBe(401);
  });

  it("rejects a wrong secret of a different length", () => {
    expect(requireSyncSecret(request("Bearer nope"))?.status).toBe(401);
  });

  it("rejects the secret without the Bearer prefix", () => {
    expect(requireSyncSecret(request(SECRET))?.status).toBe(401);
  });

  it("stays locked when CRON_SECRET isn't configured", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(requireSyncSecret(request(`Bearer ${SECRET}`))?.status).toBe(500);
  });
});
