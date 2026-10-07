import { NextResponse } from "next/server";
import { getPokemonByType, getPokemonList } from "@/lib/pokeapi";

export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    const name = sp.get("name")?.trim().toLowerCase() ?? "";
    const type = sp.get("type") ?? "";

    const limit = Number(sp.get("limit") ?? 20);
    const offset = Number(sp.get("offset") ?? 0);

    // ==========================================
    // GET POKEMON LIST
    // ==========================================
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100)
      return NextResponse.json({ error: "limit debe ser entre 1 y 100" }, { status: 400 });
    if (!Number.isInteger(offset) || offset < 0)
      return NextResponse.json({ error: "offset debe ser >= 0" }, { status: 400 });

    if (!name && !type) {
      return NextResponse.json(await getPokemonList(limit, offset));
    }

    // ==========================================
    // GET POKEMON BY NAME OR TYPE
    // ==========================================
    let list = type ? await getPokemonByType(type) : (await getPokemonList(100000, 0)).results;

    if (name) {
      const isId = /^\d+$/.test(name);
      list = list.filter(
        (p) => p.name.includes(name) || (isId && p.id === Number(name))
      );
    }

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