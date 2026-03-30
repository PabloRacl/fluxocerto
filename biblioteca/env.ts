import { z } from "zod";

/**
 * Schema de Validação das Variáveis de Ambiente do Sistema.
 * Se uma variável obrigatória sumir (Ex: Durante um deploy na Vercel),
 * o Node.js explodirá um erro claro Imediatamente no boot, impedindo que o 
 * sistema suba quebrado.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url("A DATABASE_URL deve ser uma URL válida"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET é obrigatório para assinar JWT"),
  NEXTAUTH_URL: z.string().url().optional(), // No Vercel é opcional
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Adicione novas credenciais de API (Google, Stripe, etc) aqui embaixo!
});

// Faz o Parse rígido interceptando o process.env do Node.
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ ERRO FATAL: Variáveis de ambiente inválidas ou ausentes!", parsedEnv.error.format());
  throw new Error("⚠️ O sistema foi impedido de iniciar devido a variáveis de ambiente ausentes. Verifique o console.error acima.");
}

/**
 * Variáveis de ambiente tipadas e já validadas pelo Zod.
 * Exporte e substitua o velho `process.env.VAR` por este hook seguro!
 */
export const env = parsedEnv.data;
