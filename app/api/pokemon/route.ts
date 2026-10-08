import { NextResponse } from "next/server";
import { getPokemonByTypes, getPokemonList } from "@/lib/pokeapi";
import { matchesForms } from "@/lib/pokemonForms";

export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    const name = sp.get("name")?.trim().toLowerCase() ?? "";
    const types = (sp.get("types") ?? "").split(",").filter(Boolean);
    const forms = (sp.get("forms") ?? "").split(",").filter(Boolean);

    const limit = Number(sp.get("limit") ?? 20);
    const offset = Number(sp.get("offset") ?? 0);

    // ==========================================
    // GET POKEMON LIST
    // ==========================================
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100)
      return NextResponse.json({ error: "limit debe ser entre 1 y 100" }, { status: 400 });
    if (!Number.isInteger(offset) || offset < 0)
      return NextResponse.json({ error: "offset debe ser >= 0" }, { status: 400 });
    if (types.length > 2)
      return NextResponse.json({ error: "Maximo 2 tipos" }, { status: 400 });

    if (!name && types.length === 0 && forms.length === 0) {
      return NextResponse.json(await getPokemonList(limit, offset));
    }

    // ==========================================
    // GET POKEMON BY NAME, TYPES OR FORMS
    // ==========================================
    let list = types.length > 0 ? await getPokemonByTypes(types) : (await getPokemonList(100000, 0)).results;

    if (forms.length > 0) {
      list = list.filter((p) => matchesForms(p.name, forms));
    }

    if (name) {
      const isId = /^\d+$/.test(name);
      list = list.filter(
        (p) => p.name.includes(name) || (isId && p.id === Number(name))
      );
    }

    list = [...list].sort((a, b) => a.id - b.id);

    return NextResponse.json({
      count: list.length,
      next: offset + limit < list.length ? true : null,
      previous: offset > 0 ? true : null,
      results: list.slice(offset, offset + limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Tipo no encontrado")
      return NextResponse.json({ error: error.message }, { status: 404 });

    console.error("Error en GET /api/pokemon:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}