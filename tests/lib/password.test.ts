import { afterEach, describe, expect, it, vi } from "vitest";
import { comparePassword, hashPassword } from "@/lib/password";

afterEach(() => vi.unstubAllEnvs());

describe("password helpers", () => {
  it("hashes passwords instead of storing the original value", async () => {
    vi.stubEnv("BCRYPT_SALT_ROUNDS", "4");
    const hash = await hashPassword("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    await expect(comparePassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(comparePassword("wrong password", hash)).resolves.toBe(false);
  });

  it("uses the default work factor when no environment override is set", async () => {
    vi.stubEnv("BCRYPT_SALT_ROUNDS", "");
    const hash = await hashPassword("test-password");

    expect(hash).toMatch(/^\$2[aby]\$14\$/);
  });
});
