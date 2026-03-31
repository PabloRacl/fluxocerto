export const dynamic = "force-dynamic";
import { authOptions } from "@/biblioteca/autenticacao";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
