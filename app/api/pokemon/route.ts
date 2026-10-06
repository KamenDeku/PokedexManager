import { NextResponse } from "next/server";
import { getPokemon } from "@/lib/pokeapi";

// ------------------------------------------
// GET /api/pokemon
// ------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        {
          error: "El 'name' es requerido",
        },
        {
          status: 400,
        }
      );
    }

    const pokemon = await getPokemon(name);
    return NextResponse.json(
      pokemon,
      {
        status: 200,
      }
    );

  } catch (error) {
    if (error instanceof Error && error.message === "Pokémon no encontrado") {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 404,
        }
      );
    }

    console.error("Error en /api/pokemon:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      {
        status: 500,
      }
    );
  }
}