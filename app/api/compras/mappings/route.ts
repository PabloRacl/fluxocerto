export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { itemImportMappingService } from "@/servicos/ItemImportMappingService";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { sucesso, tratarErro } from "@/biblioteca/resposta-api";

export async function GET() {
  try {
    const user = await obterUsuarioAutenticado();
    const mappings = await itemImportMappingService.getAllForUser(user.id);
    return sucesso({ mappings });
  } catch (error) {
    return tratarErro(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    const mappings = Array.isArray(body.mappings) ? body.mappings : [];

    await itemImportMappingService.upsertMany(user.id, mappings);

    return sucesso({ message: "Mapeamentos atualizados" });
  } catch (error) {
    return tratarErro(error);
  }
}
