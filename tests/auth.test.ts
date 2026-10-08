import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  configureNextAuth: vi.fn(),
  configureCredentials: vi.fn(),
  findFirst: vi.fn(),
  comparePassword: vi.fn(),
  auth: vi.fn(),
}));

vi.mock("next-auth", () => ({
  default: (config: unknown) => {
    mocks.configureNextAuth(config);
    return {
      handlers: { GET: vi.fn(), POST: vi.fn() },
      signIn: vi.fn(),
      signOut: vi.fn(),
      auth: mocks.auth,
    };
  },
}));
vi.mock("next-auth/providers/credentials", () => ({
  default: (config: unknown) => {
    mocks.configureCredentials(config);
    return config;
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findFirst: mocks.findFirst } },
}));
vi.mock("@/lib/password", () => ({ comparePassword: mocks.comparePassword }));

import "@/auth";

type AuthUser = { id: string; name: string; role: "PROFESSOR" | "TRAINER" };
type CredentialsProvider = {
  authorize: (credentials: Record<string, unknown> | undefined) => Promise<AuthUser | null>;
};
type AuthConfig = {
  providers: CredentialsProvider[];
  session: { strategy: string };
  callbacks: {
    jwt: (args: {
      token: Record<string, unknown>;
      user?: { id: string; role: "PROFESSOR" | "TRAINER" };
    }) => Promise<Record<string, unknown>>;
    session: (args: {
      session: { user?: Record<string, unknown> };
      token: Record<string, unknown>;
    }) => Promise<{ user?: Record<string, unknown> }>;
  };
};

const configuredAuth = mocks.configureNextAuth.mock.calls[0]?.[0] as AuthConfig;
const configuredCredentials = mocks.configureCredentials.mock.calls[0]?.[0];

describe("NextAuth credentials configuration", () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
    mocks.comparePassword.mockReset();
  });

  it("uses Credentials and JWT sessions", () => {
    expect(configuredCredentials).toBeDefined();
    expect(configuredAuth.session.strategy).toBe("jwt");
  });

  it.each([
    undefined,
    {},
    { name: "", password: "secret" },
    { name: "Misty", password: "" },
    { name: 123, password: "secret" },
    { name: "Misty", password: 123 },
  ])("rejects malformed credentials %# without querying the database", async (credentials) => {
    await expect(configuredAuth.providers[0].authorize(credentials)).resolves.toBeNull();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("rejects unknown users and passwords that fail verification", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    await expect(
      configuredAuth.providers[0].authorize({ name: "Misty", password: "secret" }),
    ).resolves.toBeNull();
    expect(mocks.comparePassword).not.toHaveBeenCalled();

    mocks.findFirst.mockResolvedValueOnce({
      id: 7,
      name: "Misty",
      password: "stored-hash",
      role: "TRAINER",
    });
    mocks.comparePassword.mockResolvedValue(false);
    await expect(
      configuredAuth.providers[0].authorize({ name: "Misty", password: "wrong" }),
    ).resolves.toBeNull();
    expect(mocks.comparePassword).toHaveBeenCalledWith("wrong", "stored-hash");
  });

  it("returns a minimal user after successful password verification", async () => {
    mocks.findFirst.mockResolvedValue({
      id: 7,
      name: "Misty",
      password: "stored-hash",
      role: "TRAINER",
    });
    mocks.comparePassword.mockResolvedValue(true);

    await expect(
      configuredAuth.providers[0].authorize({ name: "Misty", password: "secret" }),
    ).resolves.toEqual({ id: "7", name: "Misty", role: "TRAINER" });
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { name: "Misty" },
      select: { id: true, name: true, password: true, role: true },
    });
  });

  it("copies user ID and role into JWT, then exposes them on the session", async () => {
    const token = await configuredAuth.callbacks.jwt({
      token: {},
      user: { id: "7", role: "PROFESSOR" },
    });
    expect(token).toEqual({ id: "7", role: "PROFESSOR" });

    const session = await configuredAuth.callbacks.session({
      session: { user: { name: "Professor Oak" } },
      token,
    });
    expect(session.user).toEqual({
      name: "Professor Oak",
      id: "7",
      role: "PROFESSOR",
    });
  });

  it("does not replace JWT values when there is no newly authenticated user", async () => {
    const token = { id: "7", role: "TRAINER" };
    await expect(configuredAuth.callbacks.jwt({ token })).resolves.toEqual(token);
  });
});
