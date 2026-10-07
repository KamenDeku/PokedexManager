import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      status: 401,
    };
  }

  return {
    session,
    status: 200,
  };
}

export async function requireProfessor() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      status: 401,
    };
  }

  if (session.user.role !== "PROFESSOR") {
    return {
      session: null,
      status: 403,
    };
  }

  return {
    session,
    status: 200,
  };
}