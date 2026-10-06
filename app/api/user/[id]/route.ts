import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

// ==========================================
// GET USER
// ==========================================
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {

    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        {
          error: "ID invalido",
        }, { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuario no encontrado",
        }, { status: 404 }
      );
    }

    return NextResponse.json(
      user,
      { status: 200 }
    );

  } catch (error) {

    console.error("Error en GET /api/user/[id]:",error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}

// ==========================================
// PATCH USER
// ==========================================
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        {
          error: "ID invalido",
        }, { status: 400 }
      );
    }

    const body = await request.json();
    const { name, password, role, } = body;

    if (role && role !== "PROFESSOR" && role !== "TRAINER") {
      return NextResponse.json(
        {
          error: "role debe ser PROFESSOR o TRAINER",
        }, { status: 400 }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!existingUser) {
      return NextResponse.json(
        {
          error: "Usuario no encontrado",
        }, { status: 404 }
      );
    }

    let hashedPassword: string | undefined;

    if (password !== undefined) {hashedPassword = await hashPassword(password);}

    const user = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...(name !== undefined && { name }),
          ...(hashedPassword !== undefined && { password: hashedPassword }),
          ...(role !== undefined && { role }),
        },
        select: {
          id: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

    return NextResponse.json(
      user, { status: 200 }
    );

  } catch (error) {

    console.error("Error en PATCH /api/user/[id]:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}

// ==========================================
// DELETE USER
// ==========================================
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {

    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        {
          error: "ID invalido",
        }, { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!existingUser) {
      return NextResponse.json(
        {
          error: "Usuario no encontrado",
        }, { status: 404 }
      );
    }

    await prisma.$transaction(async (transaction) => {
      const collections = await transaction.collection.findMany({
          where: {
            userId,
          },
          select: {
            pokemonId: true,
          },
        });

      await transaction.user.delete({
        where: {
          id: userId,
        },
      });

      for (const collection of collections) {
        const remainingCollection = await transaction.collection.findFirst({where: {pokemonId: collection.pokemonId,},});

        if (!remainingCollection) {
          await transaction.pokemon.delete({
            where: {
              id: collection.pokemonId,
            },
          });

        }
      }
    });

    return NextResponse.json(
      {
        message: "Usuario eliminado",
      }, { status: 200 }
    );

  } catch (error) {

    console.error("Error en DELETE /api/user/[id]:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}