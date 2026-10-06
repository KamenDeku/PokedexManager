import { NextResponse } from "next/server";
import {getPokemon, getPokemonList} from "@/lib/pokeapi";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    // ==========================================
    // GET ONE - POKEAPI
    // ==========================================
    if (name) {
      const pokemon = await getPokemon(name);

      return NextResponse.json(
        pokemon, { status: 200 }
      );
    }

    // ==========================================
    // GET ALL - POKEAPI
    // ==========================================
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = limitParam? Number(limitParam) : 20;
    const offset = offsetParam ? Number(offsetParam) : 0;

    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {

      return NextResponse.json(
        {
          error: "limit debe ser un numero entre 1 y 100",
        }, { status: 400 }
      );
    }

    if (!Number.isInteger(offset) || offset < 0) {

      return NextResponse.json(
        {
          error: "offset debe ser un numero mayor o igual a 0",
        }, { status: 400 }
      );
    }

    const pokemon = await getPokemonList(limit,offset);

    return NextResponse.json(
      pokemon,{ status: 200 }
    );

  } catch (error) {

    if (error instanceof Error && error.message === "Pokemon no encontrado") {

      return NextResponse.json(
        {
          error: error.message,
        }, { status: 404 }
      );
    }

    console.error("Error en GET /api/pokemon:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}