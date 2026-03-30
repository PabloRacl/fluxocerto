import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { Role, Plan } from "@prisma/client";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      plan: Plan;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
    plan: Plan;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    plan: Plan;
  }
}
