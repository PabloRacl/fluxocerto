export const dynamic = "force-dynamic";
import { NextRequest, NextResponse, after } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { itemImportMappingService } from "@/servicos/ItemImportMappingService";
import * as pdfParse from "pdf-parse";
import { prisma } from "@/biblioteca/prisma";

// Fila em memória para MVP (Em cluster multi-nodo usaríamos Redis/Upstash)
const importJobs = new Map<string, any>();

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId || !importJobs.has(jobId)) {
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
  }
  return NextResponse.json(importJobs.get(jobId));
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
        { error: "PREMIUM_FEATURE: A importação inteligente e processamento de NFe/PDF estão disponíveis apenas no plano PRO." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const pdfFile = formData.get("pdf") as File;

    if (!pdfFile) {
      return NextResponse.json({ error: "Arquivo PDF não encontrado" }, { status: 400 });
    }

    // Phase 2: Arquitetura Assíncrona - Retorna 202 imediatamente e processa OCR no background
    const jobId = crypto.randomUUID();
    importJobs.set(jobId, { status: "processing" });

    const buffer = Buffer.from(await pdfFile.arrayBuffer());
    const userId = user.id;

    after(async () => {
      try {
        const data = await (pdfParse as any)(buffer);
        const text = data.text;
        const dadosExtraidos = parsearNotaFiscal(text);
        const mappedItems = await itemImportMappingService.applyMappingsToItems(userId, dadosExtraidos.items || []);
        
        importJobs.set(jobId, {
          status: "done",
          data: {
            ...dadosExtraidos,
            items: mappedItems,
          }
        });
      } catch (err: any) {
        importJobs.set(jobId, { status: "error", error: err.message });
      }
    });

    return NextResponse.json({ jobId, status: "processing" }, { status: 202 });
  } catch (error) {
    console.error("Erro ao processar PDF:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

function parsearNotaFiscal(text: string) {
  const linhas = text
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l);

  let description = "Compra importada de NF";
  let storeName = "";
  let totalAmount = 0;
  let purchaseDate = new Date().toISOString().split("T")[0];
  const items: any[] = [];

  const parseDecimal = (value: string) => {
    const raw = String(value || "").trim();
    if (!raw) return 0;

    const hasComma = raw.includes(",");
    const hasDot = raw.includes(".");

    let normalized = raw;
    if (hasComma && hasDot) {
      normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
    } else if (hasComma) {
      normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
    }

    const num = Number(normalized);
    return Number.isNaN(num) ? 0 : num;
  };

  const isTotalLine = (line: string) =>
    /qtd\.?\s+total|valor\s+total|subtotal|icms|iss|desconto|base\s+de\s+cálculo/i.test(line);

  const extractNameFromHeader = (line: string) => {
    const parts = line.replace(/\s+/g, " ").trim().split(" ");
    if (parts.length <= 2) return line;

    const first = parts[0].replace(/\D/g, "");
    const second = parts[1].replace(/\D/g, "");
    if (/^\d+$/.test(first) && (second.length >= 8 || /^\d{13,}$/.test(parts[1]))) {
      return parts.slice(2).join(" ");
    }

    if (/^\d{13,}$/.test(parts[0])) {
      return parts.slice(1).join(" ");
    }

    return line;
  };

  const parseFullItemLine = (line: string) => {
    const normalized = line.replace(/\s+/g, " ").trim();
    const fullPattern = /^(?:\d+\s+)?(?:\d{8,15}\s+)?(.+?)\s+(\d+[.,]\d+)\s*(un|pc|kg|g|ml|l)?\s*x\s*(\d+[.,]\d+)\s+(\d+[.,]\d+)$/i;
    const fullMatch = normalized.match(fullPattern);
    if (fullMatch) {
      return {
        name: fullMatch[1].trim(),
        quantity: parseDecimal(fullMatch[2]),
        unit: fullMatch[3] ? fullMatch[3].toLowerCase() : "un",
        unitPrice: parseDecimal(fullMatch[4]),
        totalPrice: parseDecimal(fullMatch[5]),
      };
    }
    const noXPattern = /^(?:\d+\s+)?(?:\d{8,15}\s+)?(.+?)\s+(\d+[.,]\d+)\s*(un|pc|kg|g|ml|l)?\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)$/i;
    const noXMatch = normalized.match(noXPattern);
    if (noXMatch) {
      return {
        name: noXMatch[1].trim(),
        quantity: parseDecimal(noXMatch[2]),
        unit: noXMatch[3] ? noXMatch[3].toLowerCase() : "un",
        unitPrice: parseDecimal(noXMatch[4]),
        totalPrice: parseDecimal(noXMatch[5]),
      };
    }
    return null;
  };

  const parseQtyLine = (line: string) => {
    const normalized = line.replace(/\s+/g, " ").trim();
    const qtyPattern = /^(\d+[.,]\d+)\s*(un|pc|kg|g|ml|l)?\s*x\s*(\d+[.,]\d+)\s+(\d+[.,]\d+)$/i;
    const qtyMatch = normalized.match(qtyPattern);
    if (qtyMatch) {
      return {
        quantity: parseDecimal(qtyMatch[1]),
        unit: qtyMatch[2] ? qtyMatch[2].toLowerCase() : "un",
        unitPrice: parseDecimal(qtyMatch[3]),
        totalPrice: parseDecimal(qtyMatch[4]),
      };
    }
    const qtyPatternNoX = /^(\d+[.,]\d+)\s*(un|pc|kg|g|ml|l)?\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)$/i;
    const qtyNoXMatch = normalized.match(qtyPatternNoX);
    if (qtyNoXMatch) {
      return {
        quantity: parseDecimal(qtyNoXMatch[1]),
        unit: qtyNoXMatch[2] ? qtyNoXMatch[2].toLowerCase() : "un",
        unitPrice: parseDecimal(qtyNoXMatch[3]),
        totalPrice: parseDecimal(qtyNoXMatch[4]),
      };
    }
    return null;
  };

  let lastItemDescription: string | null = null;
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    const lowerLine = linha.toLowerCase();

    if (lowerLine.includes("emitente") || lowerLine.includes("loja")) {
      storeName = linha.split(":")[1]?.trim() || linha;
      continue;
    }
    const dataMatch = linha.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (dataMatch) {
      purchaseDate = `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`;
      continue;
    }
    if (lowerLine.match(/valor total|total geral|total da nota|valor a pagar|valor pago/)) {
      const valorMatch = linha.match(/R\$\s*([\d.,]+)/);
      if (valorMatch) {
        totalAmount = Math.round(Number(valorMatch[1].replace(/\./g, "").replace(/,/g, ".")) * 100);
      }
      continue;
    }
    if (isTotalLine(linha)) continue;

    const itemFull = parseFullItemLine(linha);
    if (itemFull && itemFull.name && itemFull.unitPrice > 0) {
      items.push(itemFull);
      lastItemDescription = null;
      continue;
    }

    const qtyItem = parseQtyLine(linha);
    if (qtyItem && lastItemDescription) {
      items.push({
        name: lastItemDescription,
        ...qtyItem,
      });
      lastItemDescription = null;
      continue;
    }
    if (qtyItem) {
      lastItemDescription = null;
      continue;
    }

    const nextLine = (linhas[i + 1] || "").trim();
    const nextQtyItem = parseQtyLine(nextLine);
    if (nextQtyItem) {
      const candidateName = extractNameFromHeader(linha);
      if (candidateName) {
        items.push({
          name: candidateName,
          ...nextQtyItem,
        });
        i += 1;
        lastItemDescription = null;
        continue;
      }
    }

    if (!/(?:r\$|total|subtotal|desc|valor|qtd|faturado|sacado)/i.test(linha)) {
      const candidateName = extractNameFromHeader(linha);
      if (candidateName && candidateName.length > 1 && candidateName.length < 120) {
        lastItemDescription = candidateName;
      } else {
        lastItemDescription = null;
      }
    }
  }

  if (items.length > 0) {
    totalAmount = items.reduce((acc, item) => acc + Math.round(item.quantity * item.unitPrice * 100), 0);
  }

  return {
    description,
    storeName: storeName || "Loja não identificada",
    totalAmount,
    purchaseDate,
    items,
  };
}
