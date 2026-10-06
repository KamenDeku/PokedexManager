import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET ALL USERS
// ==========================================
export async function GET() {
  try {
    const users = await prisma.user.findMany({
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

// ==========================================
// POST USER
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, password, role, } = body;

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
          error: "role debe ser PROFESSOR o TRAINER",
        }, { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        password,
        role: role || "TRAINER",
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

    console.error("Error en POST /api/user:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      }, { status: 500 }
    );
  }
}