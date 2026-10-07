import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { requireProfessor } from "@/lib/authorization";

// ==========================================
// GET /api/user/:id
// ==========================================
export async function GET(request: Request, context: {params: Promise<{ id: string }>;}) {

  try {
    const authResult = await requireProfessor();

    if (!authResult.session) {
      return NextResponse.json(
        {
          error:
            authResult.status === 401
              ? "No autenticado"
              : "No tienes permiso para realizar esta accion",
        },
        {
          status: authResult.status,
        }
      );
    }

    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {

      return NextResponse.json(
        {
          error: "ID invalido",
        }, { status: 400 }
      );
    }

    // ==========================================
    // USER
    // ==========================================
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
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      user,
      { status: 200 }
    );

  } catch (error) {

    console.error("Error en GET /api/user/[id]:", error);

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
export async function PATCH(
  request: Request,
  context: {params: Promise<{ id: string }>;}) {

  try {
    const authResult = await requireProfessor();

    if (!authResult.session) {
      return NextResponse.json(
        {
          error:
            authResult.status === 401
              ? "No autenticado"
              : "No tienes permiso para realizar esta accion",
        },
        {
          status: authResult.status,
        }
      );
    }

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
    const {name, password, role,} = body;

    // ==========================================
    // ROLE VALIDATION
    // ==========================================
    if (role && role !== "PROFESSOR" && role !== "TRAINER") {

      return NextResponse.json(
        {
          error:
            "role debe ser PROFESSOR o TRAINER",
        }, { status: 400 }
      );
    }

    if (role !== undefined && Number(authResult.session.user.id) === userId) {
      return NextResponse.json(
        {
          error: "No puedes modificar tu propio rol",
        }, { status: 403 }
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
        },
        { status: 404 }
      );
    }

    let hashedPassword: string | undefined;

    if (password !== undefined) {
      hashedPassword = await hashPassword(password);
    }

    // ==========================================
    // UPDATE USER
    // ==========================================
    const user = await prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          ...(name !== undefined && {
            name,
          }),

          ...(password !== undefined && {
            password: hashedPassword,
          }),

          ...(role !== undefined && {
            role,
          }),
        },

        select: {
          id: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

    return NextResponse.json(
      user,
      { status: 200 }
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
export async function DELETE(request: Request, context: {params: Promise<{ id: string }>;}) {

  try {
    const authResult = await requireProfessor();

    if (!authResult.session) {
      return NextResponse.json(
        {
          error:
            authResult.status === 401
              ? "No autenticado"
              : "No tienes permiso para realizar esta accion",
        },
        {
          status: authResult.status,
        }
      );
    }

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

    if (existingUser.role === "PROFESSOR") {
      const professors = await prisma.user.count({
        where: {
          role: "PROFESSOR",
        },
      });

      if (professors <= 1) {
        return NextResponse.json(
          {
            error: "No se puede eliminar al ultimo PROFESSOR",
          }, { status: 400 }
        );
      }
    }

    // ==========================================
    // DELETE USER
    // ==========================================
    await prisma.$transaction(
      async (transaction) => {

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

        // ==========================================
        // CLEAN UNUSED POKEMON
        // ==========================================
        for (const collection of collections) {
          const remainingCollection = await transaction.collection.findFirst({
              where: {
                pokemonId:
                  collection.pokemonId,
              },
            });

          if (!remainingCollection) { await transaction.pokemon.delete({
              where: {
                id: collection.pokemonId,
              },
            });
          }
        }
      }
    );

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