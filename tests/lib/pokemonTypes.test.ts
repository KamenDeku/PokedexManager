import { describe, expect, it } from "vitest";
import { pokemonTypes } from "@/lib/pokemonTypes";

describe("Pokémon type metadata", () => {
  it("contains all 18 canonical type values exactly once", () => {
    const values = pokemonTypes.map(({ value }) => value);

    expect(values).toHaveLength(18);
    expect(new Set(values).size).toBe(values.length);
    expect(values).toContain("fairy");
    expect(values).toContain("steel");
  });

  it("provides a localized label and color for every type", () => {
    expect(
      pokemonTypes.every(
        (type) => type.label.length > 0 && /^#[0-9a-f]{6}$/i.test(type.color),
      ),
    ).toBe(true);
  });
});
