import { createWorker } from "tesseract.js";

export class OCRService {
  async processImage(imageBuffer: Buffer): Promise<string> {
    const worker = await createWorker("por"); // Português
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    return text;
  }

  /**
   * Tenta extrair dados estruturados do texto bruto da NF (OCR)
   * Baseado no padrão de regex usado no route.ts de PDF
   */
  parseNFText(text: string) {
    // Aqui reutilizaremos a lógica de parsearNotaFiscal que está no route.ts
    // No futuro, isso deveria estar em um serviço compartilhado (e.g. NFParseService)
    return this._internalParse(text);
  }

  private _internalParse(text: string) {
    const linhas = text
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l);

    let description = "Compra importada via Scanner (OCR)";
    let storeName = "";
    let totalAmount = 0;
    let purchaseDate = new Date().toISOString().split("T")[0];
    const items: any[] = [];

    const parseDecimal = (value: string) => {
      const raw = String(value || "").trim().replace(/[^\d.,]/g, "");
      if (!raw) return 0;
      const normalized = raw.replace(/\./g, "").replace(/,/g, ".");
      const num = Number(normalized);
      return Number.isNaN(num) ? 0 : num;
    };

    // Padrão simplificado para OCR (que costuma ser mais ruidoso que PDF)
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const lowerLine = linha.toLowerCase();

      // Detectar Data
      const dataMatch = linha.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
      if (dataMatch) {
         purchaseDate = `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`;
      }

      // Detectar Valor Total (heurística)
      if (lowerLine.includes("total") || lowerLine.includes("valor a pagar")) {
        const valorMatch = linha.match(/([\d.,]+)$/);
        if (valorMatch) {
          totalAmount = Math.round(parseDecimal(valorMatch[1]) * 100);
        }
      }

      // Detectar Itens (Heurística: Nome + Valor no final)
      const itemMatch = linha.match(/^(.+?)\s+([\d.,]+)$/);
      if (itemMatch && !lowerLine.includes("total") && !lowerLine.includes("subtotal")) {
        const name = itemMatch[1].trim();
        const price = parseDecimal(itemMatch[2]);
        if (name.length > 3 && price > 0) {
          items.push({
            name,
            quantity: 1,
            unit: "un",
            unitPrice: price,
            totalPrice: price,
          });
        }
      }
    }

    // Se não pegou total mas tem itens, soma os itens
    if (totalAmount === 0 && items.length > 0) {
      totalAmount = items.reduce((acc, item) => acc + Math.round(item.totalPrice * 100), 0);
    }

    return {
      description,
      storeName: storeName || "Loja Identificada por OCR",
      totalAmount,
      purchaseDate,
      items,
    };
  }
}

export const ocrService = new OCRService();
