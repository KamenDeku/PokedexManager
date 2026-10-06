import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// PATCH
// ==========================================
export async function PATCH(request: Request, context: {params: Promise<{id: string;}>;}) {
  try {
    const { id } = await context.params;
    const collectionId = Number(id);

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      return NextResponse.json(
        {
          error: "ID invalido",
        },{ status: 400 }
      );
    }

    const body =await request.json();
    const { status } = body;

    if (status !== "CAUGHT" && status !== "RELEASED") {
      return NextResponse.json(
        {
          error: "status debe ser CAUGHT o RELEASED",
        }, { status: 400 }
      );
    }

    const existingCollection = await prisma.collection.findUnique({where: {id: collectionId,},});

    if (!existingCollection) {
      return NextResponse.json(
        {
          error: "Registro de coleccion no encontrado",
        }, { status: 404 }
      );
    }

    // ==========================================
    // UPDATE
    // ==========================================
    const collection = await prisma.collection.update({where: {id: collectionId,}, data: {status,}, include: {pokemon: true,},});

    return NextResponse.json(collection,{ status: 200 });

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
// DELETE
// ==========================================
export async function DELETE(request: Request, context: {params: Promise<{id: string;}>;}) {

  try {
    const { id } = await context.params;
    const collectionId = Number(id);

    if (!Number.isInteger(collectionId) || collectionId <= 0) {

      return NextResponse.json(
        {
          error: "ID inválido",
        }, { status: 400 }
      );
    }

    const existingCollection = await prisma.collection.findUnique({where: {id: collectionId,},});

    if (!existingCollection) {
      return NextResponse.json(
        {
          error: "Registro de colección no encontrado",
        }, { status: 404 }
      );
    }

    // ==========================================
    // HARD DELETE
    // ==========================================
    await prisma.collection.delete({where: {id: collectionId,},});

    return NextResponse.json(
      {
        message: "Pokemon eliminado de la coleccion",
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