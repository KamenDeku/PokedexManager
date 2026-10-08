import { describe, expect, it } from "vitest";
import { getUserRoleLabel, userRoles } from "@/lib/userRoles";

describe("user role labels", () => {
  it("maps supported roles to localized labels", () => {
    expect(getUserRoleLabel("PROFESSOR")).toBe("Profesor");
    expect(getUserRoleLabel("TRAINER")).toBe("Entrenador");
  });

  it("declares the expected roles", () => {
    expect(userRoles.map(({ value }) => value)).toEqual(["PROFESSOR", "TRAINER"]);
  });
});
