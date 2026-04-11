export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { painelService } from "@/servicos/PainelService";

// get - patrimônio líquido
export async function GET() {
  try {
    const user = await obterUsuarioAutenticado();
    const patrimonio = await painelService.obterPatrimonio(user.id);

    return NextResponse.json({ ok: true, data: patrimonio });
  } catch (error) {
    return tratarErro(error);
  }
}
