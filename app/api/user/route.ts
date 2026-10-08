import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { requireProfessor } from "@/lib/authorization";

export async function GET() {

  try {
    const authResult =
      await requireProfessor();

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

    const users =
      await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          role: true,
          createdAt: true,
        },

        orderBy: {
          id: "asc",
        },
      });

    return NextResponse.json(
      users,
      { status: 200 }
    );

  } catch (error) {

    console.error("Error en GET /api/user:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}

export async function POST(request: Request) {

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

    const body = await request.json();
    const { name, password, role,} = body;

    if (!name || !password) {

      return NextResponse.json(
        {
          error: "name y password son requeridos",
        }, { status: 400 }
      );
    }

    if (role && role !== "PROFESSOR" && role !== "TRAINER") {

      return NextResponse.json(
        {
          error:
            "role debe ser PROFESSOR o TRAINER",
        }, { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        name,
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        {
          error: "Ya existe un usuario con ese nombre",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user =
      await prisma.user.create({
        data: {
          name,
          password: hashedPassword,
          role:
            role || "TRAINER",
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
      { status: 201 }
    );

  } catch (error) {

    console.error(
      "Error en POST /api/user:",
      error
    );

    if (
      error && typeof error === "object" && "code" in error && error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "Ya existe un usuario con ese nombre",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}