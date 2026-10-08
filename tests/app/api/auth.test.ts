import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));
vi.mock("@/auth", () => ({ handlers: mocks.handlers }));

import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

describe("NextAuth route handler exports", () => {
  it("re-exports the configured NextAuth GET and POST handlers", () => {
    expect(GET).toBe(mocks.handlers.GET);
    expect(POST).toBe(mocks.handlers.POST);
  });
});
