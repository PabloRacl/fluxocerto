import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// ============================================
// ESTENDER O TIPO DE SESSÃO
// ============================================
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

// ============================================
// ESTENDER O TIPO DE JWT
// ============================================
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}