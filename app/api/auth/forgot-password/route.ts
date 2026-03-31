export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/biblioteca/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por segurança, não informamos se o e-mail existe ou não
      return NextResponse.json({ message: "Se o e-mail estiver cadastrado, você receberá um link de recuperação." });
    }

    // Gerar token seguro
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000 * 2); // 2 horas de validade

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: expiry,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin || "http://localhost:3000";
    const resetUrl = `${baseUrl}/resetar-senha?token=${resetToken}`;

    // TODO: Implementar envio real via Resend/SendGrid
    // Por enquanto, logamos no terminal para teste em desenvolvimento
    console.log("------------------------------------------");
    console.log(`[RECOVERY] Solicitação para: ${email}`);
    console.log(`[RECOVERY] Link: ${resetUrl}`);
    console.log("------------------------------------------");

    // FALLBACK: Se houver RESEND_API_KEY, enviar e-mail real
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "FluxoCerto <onboarding@resend.dev>",
            to: [email],
            subject: "Recuperação de Acesso Neural - FluxoCerto",
            html: `
              <div style="font-family: sans-serif; padding: 20px; background-color: #020617; color: #f8fafc; border-radius: 10px;">
                <h1 style="color: #10b981;">Recuperação Neural</h1>
                <p>Você solicitou a redefinição da sua chave de acesso ao <strong>FluxoCerto</strong>.</p>
                <p>Clique no botão abaixo para criar sua nova senha:</p>
                <div style="margin: 30px 0;">
                  <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Redefinir Minha Senha</a>
                </div>
                <p style="font-size: 12px; color: #64748b;">Este link é válido por 2 horas. Se você não solicitou esta alteração, ignore este e-mail.</p>
              </div>
            `,
          }),
        });
      } catch (err) {
        console.error("Falha ao enviar e-mail real via Resend:", err);
      }
    }

    return NextResponse.json({ 
      message: "Protocolo de recuperação iniciado.",
      // Retornamos o link apenas em desenvolvimento para facilitar seu teste
      debugLink: process.env.NODE_ENV === "development" ? resetUrl : undefined
    });
  } catch (error) {
    console.error("Erro na recuperação de senha:", error);
    return NextResponse.json({ error: "Erro interno no protocolo de segurança" }, { status: 500 });
  }
}
