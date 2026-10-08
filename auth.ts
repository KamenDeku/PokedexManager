import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        name: {
          label: "Usuario",
          type: "text",
        },
        password: {
          label: "Contraseña",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (
          typeof credentials?.name !== "string" ||
          typeof credentials.password !== "string" ||
          !credentials.name ||
          !credentials.password
        ) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: { name: credentials.name },
          select: {
            id: true,
            name: true,
            password: true,
            role: true,
          },
        });

        if (!user || !(await comparePassword(credentials.password, user.password))) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
});