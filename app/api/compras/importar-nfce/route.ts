import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { itemImportMappingService } from "@/servicos/ItemImportMappingService";

const parseDecimal = (value: any) => {
  if (value === null || value === undefined) return 0;
  const raw = String(value).trim();
  if (raw === "") return 0;

  let normalized = raw;
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    // Ex: 1.234,56 => remover milhar, converter decimal
    normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
  } else if (hasComma) {
    // Ex: 389,63
    normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
  } else if (hasDot) {
    // Ex: 389.63
    normalized = normalized;
  } else {
    // Ex: 38963
    normalized = normalized;
  }

  const num = Number(normalized);
  if (Number.isNaN(num)) return 0;
  return num;
};

export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const chaveRaw = request.nextUrl.searchParams.get("chave") || request.nextUrl.searchParams.get("numero");
    if (!chaveRaw) {
      return NextResponse.json({ error: "Parâmetro 'chave' é obrigatório" }, { status: 400 });
    }

    const chave = String(chaveRaw).replace(/\D/g, "");
    if (chave.length !== 44) {
      return NextResponse.json({ error: "Chave NFC-e inválida" }, { status: 400 });
    }

    // Detecção dinâmica de UF baseada nos primeiros 2 dígitos (IBGE)
    const ufCodigo = chave.substring(0, 2);
    const ufMap: Record<string, { uf: string, url: string }> = {
      "26": { uf: "PE", url: "https://nfce.sefaz.pe.gov.br/nfce/consulta" },
      "35": { uf: "SP", url: "https://www.nfce.fazenda.sp.gov.br/consulta" },
      "43": { uf: "RS", url: "https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx" },
      "31": { uf: "MG", url: "https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/consulta.xhtml" },
      "41": { uf: "PR", url: "http://www.fazenda.pr.gov.br/nfce/consulta" },
      "33": { uf: "RJ", url: "https://www.fazenda.rj.gov.br/nfce/consulta" },
      "29": { uf: "BA", url: "https://sistemas.sefaz.ba.gov.br/nfce/consulta" },
      "23": { uf: "CE", url: "https://nfce.sefaz.ce.gov.br/pages/consultarNota.jsf" },
      "52": { uf: "GO", url: "https://www.sefaz.go.gov.br/nfce/consulta" },
    };

    const ufInfo = ufMap[ufCodigo] || { uf: "PE", url: "https://nfce.sefaz.pe.gov.br/nfce/consulta" }; // Fallback para PE

    // Montando a URL de consulta (padrão QR Code v2.0+)
    const sefazUrl = `${ufInfo.url}?p=${chave}|2|1|1`; 

    const resposta = await fetch(sefazUrl, {
      headers: {
        "Accept": "application/xml, text/xml, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!resposta.ok) {
      return NextResponse.json({ 
        error: `Erro no SEFAZ (${ufInfo.uf}) ao buscar NFC-e`, 
        status: resposta.status,
        url: sefazUrl 
      }, { status: 502 });
    }

    const xml = await resposta.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      removeNSPrefix: true,
      allowBooleanAttributes: true,
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        return name === "det";
      },
    });

    const parsed = parser.parse(xml);

    const infNFe =
      parsed?.nfeProc?.proc?.nfeProc?.NFe?.infNFe ||
      parsed?.nfeProc?.proc?.nfeProc?.infNFe ||
      null;

    if (!infNFe) {
      return NextResponse.json(
        {
          error: "Não foi possível ler NFC-e do SEFAZ",
          details: "XML sem tag infNFe ou caminho inesperado",
          parsed: {
            nfeProc: parsed?.nfeProc ? true : false,
            structure: Object.keys(parsed || {}).slice(0, 10),
          },
        },
        { status: 500 },
      );
    }

    const emit = infNFe?.emit || {};
    const ide = infNFe?.ide || {};
    const total = infNFe?.total?.ICMSTot || {};

    const det = infNFe?.det || [];
    const qtdItens = Array.isArray(det) ? det.length : 0;

    const items = (Array.isArray(det) ? det : [det]).map((item: any) => {
      const prod = item?.prod || {};
      const quantity = parseDecimal(prod.qCom || prod.qTrib || 0);
      const unitPrice = parseDecimal(prod.vUnCom || prod.vUnTrib || 0);
      const totalPrice = parseDecimal(prod.vProd || 0);
      return {
        name: String(prod.xProd || "").trim(),
        quantity: quantity || 1,
        unit: String(prod.uCom || prod.uTrib || "un").trim() || "un",
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        barcode: String(prod.cEAN || prod.cEANTrib || "").trim() || null,
      };
    });

    const mappedItems = await itemImportMappingService.applyMappingsToItems(user.id, items);

    return NextResponse.json({
      description: `Compra NF ${ide.nNF || chave}`,
      storeName: (emit.xFant || emit.xNome || "Loja não identificada").trim(),
      purchaseDate: ide.dhEmi ? new Date(ide.dhEmi).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      totalAmount: Math.round(parseDecimal(total.vNF || 0) * 100),
      items: mappedItems,
      itemCount: qtdItens,
    });
  } catch (error) {
    console.error("Erro ao importar NFC-e por chave", error);
    return NextResponse.json(
      {
        error: "Erro ao importar NFC-e",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
