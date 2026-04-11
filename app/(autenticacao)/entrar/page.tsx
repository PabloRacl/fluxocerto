"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { LogoMarca } from "@/app/_componentes/LogoMarca";

// Ícones Sociais (Removidos no Lucide 1.0)
const Facebook = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Linkedin = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const FACEBOOK_CLIENT_ID = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "";
const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || "";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error === "PASSWORD_NOT_SET") {
      // Redireciona para definir senha se o usuário existe mas não tem senha
      window.location.href = `/definir-senha?email=${encodeURIComponent(email)}`;
      return;
    }

    if (result?.error) {
      setError("Email ou senha inválidos");
      setLoading(false);
    } else {
      setSuccess(true);
      window.location.href = "/painel";
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/painel" });
  };

  const handleFacebookSignIn = async () => {
    setFacebookLoading(true);
    setError("");
    await signIn("facebook", { callbackUrl: "/painel" });
  };

  const handleLinkedInSignIn = async () => {
    setLinkedinLoading(true);
    setError("");
    await signIn("linkedin", { callbackUrl: "/painel" });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent 70%)",
          }}
        />
      </div>

      {/* Overlay de sucesso */}
      {success && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 animate-pulse" />
          <p className="text-xl font-semibold text-white">Login realizado!</p>
          <p className="text-slate-400 mt-2">Redirecionando para o painel...</p>
        </div>
      )}

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <LogoMarca size="lg" className="justify-center mb-4" />
          <p className="text-slate-400 mt-2">
            Entre para controlar suas finanças
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            <div className="relative group">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed transition-all pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/esqueci-senha"
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>

          {/* Login Social - Reorganizado para baixo */}
          <div className="mt-8 pt-8 border-t border-slate-800/50">
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

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Não tem uma conta?{" "}
              <Link
                href="/cadastro"
                className={`font-medium transition-colors ${loading ? "text-slate-600 pointer-events-none" : "text-emerald-400 hover:text-emerald-300"}`}
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          © 2026 FluxoCerto. Controle financeiro inteligente.
        </p>
      </div>
    </div>
  );
}
