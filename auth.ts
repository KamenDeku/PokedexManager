import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/password";

export const { handlers, signIn, signOut, auth } =
  NextAuth({

    // ==========================================
    // PROVIDERS
    // ==========================================
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

        // ==========================================
        // AUTHORIZE
        // ==========================================
        async authorize(credentials) {

          if (!credentials?.name || !credentials?.password) {
            return null;
          }

          const name = String(credentials.name);
          const password = String(credentials.password);
          const user = await prisma.user.findFirst({
              where: {
                name,
              },
            });

          if (!user) {
            return null;
          }

          const passwordValid = await comparePassword(
              password,
              user.password
            );

          if (!passwordValid) {
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