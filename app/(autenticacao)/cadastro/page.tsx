"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Facebook, Linkedin } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/app/_componentes/BrandLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const FACEBOOK_CLIENT_ID = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "";
  const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || "";

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/painel" });
  };

  const handleFacebookSignIn = async () => {
    setFacebookLoading(true);
    await signIn("facebook", { callbackUrl: "/painel" });
  };

  const handleLinkedInSignIn = async () => {
    setLinkedinLoading(true);
    await signIn("linkedin", { callbackUrl: "/painel" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      // Criar usuário via API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta");
        return;
      }

      // Login automático após registro
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Conta criada, mas erro no login. Tente fazer login manualmente.",
        );
      } else {
        router.push("/painel");
        router.refresh();
      }
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background com gradiente */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-40 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent 70%)",
          }}
        />
      </div>

      {/* Card de Registro */}
      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-md rounded-3xl border border-emerald-500/30 shadow-2xl p-8 space-y-6">
        {/* Logo */}
        <div className="text-center mb-4">
          <BrandLogo size="lg" className="justify-center mb-4" />
          <p className="text-slate-400">Crie sua conta gratuita</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="Seu nome"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confirmar Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="Repita a senha"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        {/* Login Social - Reorganizado para baixo */}
        <div className="pt-8 border-t border-slate-800/50">
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading || facebookLoading || linkedinLoading}
              title="Google"
              className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 blur-xl transition-all rounded-2xl" />
              {googleLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <svg className="w-6 h-6 relative drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={handleFacebookSignIn}
              disabled={facebookLoading || loading || googleLoading || linkedinLoading}
              title="Facebook"
              className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#1877F2]/40 transition-all hover:bg-[#1877F2]/10 active:scale-95 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-[#1877F2]/20 opacity-0 group-hover:opacity-100 blur-xl transition-all rounded-2xl" />
              {facebookLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#1877F2]" />
              ) : (
                <Facebook className="w-6 h-6 text-[#1877F2] relative fill-[#1877F2]/20 drop-shadow-[0_0_10px_rgba(24,119,242,0.6)] transition-all group-hover:scale-110" />
              )}
            </button>

            <button
              type="button"
              onClick={handleLinkedInSignIn}
              disabled={linkedinLoading || loading || googleLoading || facebookLoading}
              title="LinkedIn"
              className="group relative flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#0077B5]/40 transition-all hover:bg-[#0077B5]/10 active:scale-95 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-[#0077B5]/20 opacity-0 group-hover:opacity-100 blur-xl transition-all rounded-2xl" />
              {linkedinLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#0077B5]" />
              ) : (
                <Linkedin className="w-6 h-6 text-[#0077B5] relative fill-[#0077B5]/20 drop-shadow-[0_0_10px_rgba(0,119,181,0.6)] transition-all group-hover:scale-110" />
              )}
            </button>
          </div>
        </div>

        {/* Link de Login */}
        <div className="text-center">
          <p className="text-slate-400">
            Já tem uma conta?{" "}
            <Link
              href="/entrar"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Fazer login
            </Link>
          </p>
        </div>

        {/* Voltar para Home */}
        <div className="text-center pt-4 border-t border-slate-800">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            ← Voltar para página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
