import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { bankService } from "@/servicos/BankService";
import { tratarErro } from "@/biblioteca/tratar-erro";

export async function POST() {
  try {
    const user = await obterUsuarioAutenticado();
    const token = await bankService.createConnectToken(user.id);
    return NextResponse.json({ token });
  } catch (error) {
    return tratarErro(error);
  }
}
