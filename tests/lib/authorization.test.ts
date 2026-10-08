import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));

import { requireAuth, requireProfessor } from "@/lib/authorization";

describe("authorization helpers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when there is no authenticated user", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(requireAuth()).resolves.toEqual({ session: null, status: 401 });
    await expect(requireProfessor()).resolves.toEqual({ session: null, status: 401 });
  });

  it("allows any authenticated user through requireAuth", async () => {
    const session = { user: { id: "8", role: "TRAINER" } };
    mocks.auth.mockResolvedValue(session);

    await expect(requireAuth()).resolves.toEqual({ session, status: 200 });
  });

  it("allows professors and denies trainers from professor-only operations", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "8", role: "PROFESSOR" } });
    await expect(requireProfessor()).resolves.toMatchObject({ status: 200 });

    mocks.auth.mockResolvedValue({ user: { id: "8", role: "TRAINER" } });
    await expect(requireProfessor()).resolves.toEqual({ session: null, status: 403 });
  });

  it("propagates authentication service failures", async () => {
    mocks.auth.mockRejectedValue(new Error("session store unavailable"));

    await expect(requireAuth()).rejects.toThrow("session store unavailable");
  });
});
