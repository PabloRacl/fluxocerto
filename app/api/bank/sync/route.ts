import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { bankService } from "@/servicos/BankService";
import { tratarErro } from "@/biblioteca/tratar-erro";

export async function POST(req: Request) {
  try {
    const user = await obterUsuarioAutenticado();
    const { itemId } = await req.json();
    
    if (!itemId) throw new Error("ID do item é obrigatório");
    
    const bankItem = await bankService.syncItem(user.id, itemId);
    return NextResponse.json({ success: true, item: bankItem });
  } catch (error) {
    return tratarErro(error);
  }
}
