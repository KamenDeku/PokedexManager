import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));
vi.mock("next-auth/react", () => ({ useSession: mocks.useSession }));

import PokemonCard from "@/components/PokemonCard";
import PokemonCollection from "@/components/PokemonCollection";
import PokemonGrid from "@/components/PokemonGrid";
import UsersInfo from "@/components/UsersInfo";

describe("data-driven component initial render", () => {
  beforeEach(() => {
    mocks.useSession.mockReturnValue({ data: null, status: "unauthenticated" });
  });

  it("renders a Pokémon card's identity, formatted Pokédex number, and owned marker", () => {
    const markup = renderToStaticMarkup(
      createElement(PokemonCard, {
        pokemon: { id: 25, name: "pikachu", sprite: "/pikachu.png" },
        owned: true,
      }),
    );

    expect(markup).toContain("#025");
    expect(markup).toContain("pikachu");
    expect(markup).toContain('src="/pikachu.png"');
    expect(markup).toContain('alt="Mi PC"');
    expect(markup).toContain('src="/svg/pokeball.svg"');
  });

  it("renders the Pokémon grid loading state before its fetch resolves", () => {
    const markup = renderToStaticMarkup(
      createElement(PokemonGrid, {
        search: "",
        types: [],
        forms: [],
        page: 1,
        setPage: vi.fn(),
        ownedIds: [],
        onOwnedChange: vi.fn(),
      }),
    );

    expect(markup).toContain("Cargando Pokemon...");
  });

  it("renders the collection loading state before its fetch resolves", () => {
    const markup = renderToStaticMarkup(
      createElement(PokemonCollection, {
        userId: null,
        search: "",
        types: [],
        forms: [],
        page: 1,
        setPage: vi.fn(),
      }),
    );

    expect(markup).toContain("Cargando coleccion...");
  });

  it("renders the users loading state before its fetch resolves", () => {
    const markup = renderToStaticMarkup(
      createElement(UsersInfo, {
        search: "",
        role: "",
        page: 1,
        setPage: vi.fn(),
        onSelectUser: vi.fn(),
      }),
    );

    expect(markup).toContain("Cargando usuarios...");
  });
});
