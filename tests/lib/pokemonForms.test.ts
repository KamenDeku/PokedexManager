import { describe, expect, it } from "vitest";
import { matchesForms, pokemonForms } from "@/lib/pokemonForms";

describe("Pokémon form helpers", () => {
  it("matches all forms when no form filter is selected", () => {
    expect(matchesForms("pikachu", [])).toBe(true);
  });

  it("matches a selected form marker in a species name", () => {
    expect(matchesForms("charizard-mega-x", ["mega"])).toBe(true);
    expect(matchesForms("charizard-mega-x", ["alola", "mega"])).toBe(true);
    expect(matchesForms("raichu-alola", ["mega"])).toBe(false);
  });

  it("exports the supported forms with labels and color tokens", () => {
    expect(pokemonForms.map(({ value }) => value)).toEqual([
      "mega",
      "gmax",
      "primal",
      "alola",
      "galar",
      "hisui",
      "paldea",
    ]);
    expect(pokemonForms.every((form) => form.label.length > 0 && form.color.startsWith("#"))).toBe(
      true,
    );
  });
});
