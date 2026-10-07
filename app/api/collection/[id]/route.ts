import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireProfessor, } from "@/lib/authorization";

// ==========================================
// PATCH COLLECTION
// ==========================================
export async function PATCH(request: Request, context: {params: Promise<{ id: string }>;}) {

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
    const userId = Number(session.user.id);
    const role = session.user.role;
    const { id } = await context.params;
    const collectionId = Number(id);

    if (!Number.isInteger(collectionId) || collectionId <= 0) {

      return NextResponse.json(
        {
          error: "ID invalido",
        }, { status: 400 }
      );
    }

    const body = await request.json();

    const { status, } = body;

    if (status !== "CAUGHT" && status !== "RELEASED") {
      return NextResponse.json(
        {
          error: "status debe ser CAUGHT o RELEASED",
        }, { status: 400 }
      );
    }

    const existingCollection = await prisma.collection.findUnique({
        where: {
          id: collectionId,
        },
      });

    if (!existingCollection) {
      return NextResponse.json(
        {
          error: "Registro de coleccion no encontrado",
        }, { status: 404 }
      );
    }

    if (role === "TRAINER" && existingCollection.userId !== userId) {
      return NextResponse.json(
        {
          error: "No tienes permiso para modificar esta coleccion",
        }, { status: 403 }
      );
    }

    // ==========================================
    // UPDATE COLLECTION
    // ==========================================
    const collection = await prisma.collection.update({
        where: {
          id: collectionId,
        },

        data: {
          status,
        },

        include: {
          pokemon: true,
        },
      });

    return NextResponse.json(
      collection,
      { status: 200 }
    );

  } catch (error) {

    console.error("Error en PATCH /api/collection/[id]:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}

// ==========================================
// DELETE COLLECTION
// ==========================================
export async function DELETE(request: Request, context: {params: Promise<{ id: string }>;}) {

  try {
    const authResult = await requireProfessor();

    if (!authResult.session) {
      return NextResponse.json(
        {
          error:
            authResult.status === 401 ? "No autenticado" : "No tienes permiso para realizar esta accion",
        },
        {
          status: authResult.status,
        }
      );
    }

    const { id } = await context.params;

    const collectionId = Number(id);

    if (!Number.isInteger(collectionId) || collectionId <= 0) {

      return NextResponse.json(
        {
          error: "ID invalido",
        }, { status: 400 }
      );
    }

    const existingCollection = await prisma.collection.findUnique({
        where: {
          id: collectionId,
        },
      });

    if (!existingCollection) {

      return NextResponse.json(
        {
          error:
            "Registro de coleccion no encontrado",
        }, { status: 404 }
      );
    }

    // ==========================================
    // DELETE COLLECTION
    // ==========================================
    await prisma.$transaction(
      async (transaction) => {

        await transaction.collection.delete({
          where: {
            id: collectionId,
          },
        });

        const remainingCollection = await transaction.collection.findFirst({
            where: {
              pokemonId:
                existingCollection.pokemonId,
            },
          });

        // ==========================================
        // DELETE POKEMON IF UNUSED
        // ==========================================
        if (!remainingCollection) {
          await transaction.pokemon.delete({
            where: {
              id: existingCollection.pokemonId,
            },
          });
        }
      }
    );

    return NextResponse.json(
      {
        message:
          "Pokemon eliminado de la coleccion",
      }, { status: 200 }
    );

  } catch (error) {

    console.error("Error en DELETE /api/collection/[id]:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}