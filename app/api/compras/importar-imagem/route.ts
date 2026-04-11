export const dynamic = "force-dynamic";
import { NextRequest, NextResponse, after } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { ocrService } from "@/servicos/OCRService";
import { itemImportMappingService } from "@/servicos/ItemImportMappingService";
import { prisma } from "@/biblioteca/prisma";

// Fila em memória (Compartilhada entre instâncias do mesmo worker process)
// Nota: Em produção real com Vercel, isso deve ser um DB ou Redis.
const ocrJobs = new Map<string, any>();

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId || !ocrJobs.has(jobId)) {
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
  }
  return NextResponse.json(ocrJobs.get(jobId));
}

export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    if (usuario?.plan === "FREE") {
      return NextResponse.json(
        { error: "PREMIUM_FEATURE: O processamento neural de imagens (OCR) está disponível apenas no plano PRO." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "Arquivo de imagem não encontrado" }, { status: 400 });
    }

    const jobId = crypto.randomUUID();
    ocrJobs.set(jobId, { status: "processing", progress: 0 });

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const userId = user.id;

    // Processamento assíncrono em background (Next.js 15 'after')
    after(async () => {
      try {
        console.log(`[OCR] Iniciando processamento para Job ${jobId}...`);
        
        // 1. OCR Bruto
        const text = await ocrService.processImage(buffer);
        
        // 2. Parseamento de NF
        const dadosExtraidos = ocrService.parseNFText(text);
        
        // 3. Mapeamento Inteligente (Categorias/Contas do usuário)
        const mappedItems = await itemImportMappingService.applyMappingsToItems(userId, dadosExtraidos.items || []);
        
        ocrJobs.set(jobId, {
          status: "done",
          data: {
            ...dadosExtraidos,
            items: mappedItems,
          }
        });
        
        console.log(`[OCR] Job ${jobId} finalizado com sucesso.`);
      } catch (err: any) {
        console.error(`[OCR] Erro no Job ${jobId}:`, err);
        ocrJobs.set(jobId, { status: "error", error: err.message });
      }
    });

    return NextResponse.json({ jobId, status: "processing" }, { status: 202 });
  } catch (error) {
    console.error("Erro ao processar imagem para OCR:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar imagem",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
