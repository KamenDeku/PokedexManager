import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: "PROFESSOR" | "TRAINER";
  }

  interface Session {
    user: {
      id: string;
      name: string;
      role: "PROFESSOR" | "TRAINER";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PROFESSOR" | "TRAINER";
  }
}
