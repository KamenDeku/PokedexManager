import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authorization";

export async function POST(request: Request) {
  try {

    const authResult = await requireAuth();

    if (!authResult.session) {
      return NextResponse.json(
        {
          error: "No autenticado",
        },
        {
          status: authResult.status,
        }
      );
    }

    const userId = Number(authResult.session.user.id);
    const body = await request.json();
    const { pokeApiId, name, } = body;

    if (!pokeApiId || !name) {
      return NextResponse.json(
        {
          error: "pokeApiId y name es requerido",
        }, { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuario no encontrado",
        }, { status: 404 }
      );
    }

    const pokemon = await prisma.pokemon.upsert({
        where: {
          pokeApiId,
        },
        
        update: {},

        create: {
          pokeApiId,
          name,
        },
      });

    if (!pokemon) {
      return NextResponse.json(
        {
          error: "Pokemon no encontrado",
        }, { status: 404 }
      );
    }

    const collection = await prisma.collection.upsert({
        where: {
          userId_pokemonId: {
            userId,
            pokemonId: pokemon.id,
          },
        },

        update: {
          status: "CAUGHT",
        },

        create: {
          userId,
          pokemonId: pokemon.id,
          status: "CAUGHT",
        },

        include: {
          pokemon: true,
        },
      });

    return NextResponse.json(
      collection,
      { status: 201 }
    );

  } catch (error) {

    console.error("Error en POST /api/collection:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth();

    if (!authResult.session) {

      return NextResponse.json(
        {
          error: "No autenticado",
        },
        {
          status: authResult.status,
        }
      );
    }

    const session = authResult.session;
    const { searchParams } = new URL(request.url);
    const userParam = searchParams.get("userId");

    let userId = Number(session.user.id);

    if (userParam) {
      const targetId = Number(userParam);

      if (!Number.isInteger(targetId) || targetId <= 0) {
        return NextResponse.json(
          {
            error: "ID invalido",
          }, { status: 400 }
        );
      }

      if (targetId !== userId && session.user.role !== "PROFESSOR") {
        return NextResponse.json(
          {
            error: "No tienes permiso para ver esta coleccion",
          }, { status: 403 }
        );
      }

      userId = targetId;
    }

    const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {

      return NextResponse.json(
        {
          error: "Usuario no encontrado",
        }, { status: 404 }
      );
    }

    const collection = await prisma.collection.findMany({
        where: {
          userId,
          status: "CAUGHT",
        },

        include: {
          pokemon: true,
        },

        orderBy: {
          pokemon: {
            pokeApiId: "asc",
          },
        },
      });

    return NextResponse.json(
      collection,
      { status: 200 }
    );

  } catch (error) {

    console.error("Error en GET /api/collection:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}