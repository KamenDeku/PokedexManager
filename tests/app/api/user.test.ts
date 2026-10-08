import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  hashPassword: vi.fn(),
  requireProfessor: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      create: mocks.create,
    },
  },
}));
vi.mock("@/lib/password", () => ({ hashPassword: mocks.hashPassword }));
vi.mock("@/lib/authorization", () => ({ requireProfessor: mocks.requireProfessor }));

import { GET, POST } from "@/app/api/user/route";

const professorSession = { user: { id: "1", name: "Professor Oak", role: "PROFESSOR" } };
const request = (body: unknown) =>
  new Request("http://localhost/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("/api/user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireProfessor.mockResolvedValue({ session: professorSession, status: 200 });
  });

  it("requires professor privileges to list users", async () => {
    mocks.requireProfessor.mockResolvedValue({ session: null, status: 401 });
    const unauthenticated = await GET();
    expect(unauthenticated.status).toBe(401);

    mocks.requireProfessor.mockResolvedValue({ session: null, status: 403 });
    const forbidden = await GET();
    expect(forbidden.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("lists user fields without selecting password hashes", async () => {
    const users = [{ id: 2, name: "Misty", role: "TRAINER", createdAt: "2026-01-01" }];
    mocks.findMany.mockResolvedValue(users);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(users);
    expect(mocks.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, role: true, createdAt: true },
      orderBy: { id: "asc" },
    });
  });

  it("returns 500 when listing users fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.findMany.mockRejectedValue(new Error("database unavailable"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toHaveProperty("error", "Error interno del servidor");
  });

  it("requires professor privileges before creating a user", async () => {
    mocks.requireProfessor.mockResolvedValue({ session: null, status: 403 });

    const response = await POST(request({ name: "Misty", password: "secret" }));

    expect(response.status).toBe(403);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    [{ name: "", password: "secret" }, "name y password son requeridos"],
    [{ name: "Misty" }, "name y password son requeridos"],
    [{ name: "Misty", password: "secret", role: "ADMIN" }, "role debe ser PROFESSOR o TRAINER"],
  ])("validates new user input %#", async (body, error) => {
    const response = await POST(request(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty("error", error);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects an existing username before hashing or insertion", async () => {
    mocks.findUnique.mockResolvedValue({ id: 3 });

    const response = await POST(request({ name: "Misty", password: "secret" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toHaveProperty(
      "error",
      "Ya existe un usuario con ese nombre",
    );
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("hashes a new password and defaults its role to TRAINER", async () => {
    const created = { id: 4, name: "Misty", role: "TRAINER", createdAt: "2026-01-01" };
    mocks.findUnique.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue("bcrypt-hash");
    mocks.create.mockResolvedValue(created);

    const response = await POST(request({ name: "Misty", password: "secret" }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(created);
    expect(mocks.hashPassword).toHaveBeenCalledWith("secret");
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: "Misty", password: "bcrypt-hash", role: "TRAINER" },
      }),
    );
  });

  it("allows creating a professor and maps Prisma unique conflicts to 409", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue("bcrypt-hash");
    mocks.create.mockResolvedValue({ id: 4, name: "New Professor", role: "PROFESSOR" });

    const created = await POST(
      request({ name: "New Professor", password: "secret", role: "PROFESSOR" }),
    );
    expect(created.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "PROFESSOR" }) }),
    );

    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.create.mockRejectedValue({ code: "P2002" });
    const conflict = await POST(request({ name: "Misty", password: "secret" }));
    expect(conflict.status).toBe(409);
  });

  it("returns 500 for unexpected user creation errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.findUnique.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue("bcrypt-hash");
    mocks.create.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(request({ name: "Misty", password: "secret" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toHaveProperty("error", "Error interno del servidor");
  });
});
