"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // ✅ NOVO: Estado para feedback de redirecionamento
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsRedirecting(false);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // ✅ Erro: mostra mensagem e libera formulário
        setError("Email ou senha inválidos");
        setLoading(false);
      } else {
        // ✅ Sucesso: mostra feedback de redirecionamento
        setIsRedirecting(true);

        // Aguarda um breve momento para o usuário ver o feedback
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Redireciona e NÃO limpa o loading até completar
        await router.push("/painel");
        router.refresh();

        // ✅ Só limpa estados após redirecionamento confirmado
        // (O componente será desmontado, então isso é apenas segurança)
        setLoading(false);
        setIsRedirecting(false);
      }
    } catch (err) {
      // ✅ Erro de rede/servidor
      setError("Erro ao fazer login. Tente novamente.");
      setLoading(false);
      setIsRedirecting(false);
    }
    // ❌ REMOVIDO: finally { setLoading(false) } - causava o bug!
  };

  // ✅ Helper para determinar estado do botão
  const getButtonState = () => {
    if (isRedirecting) {
      return {
        text: "Redirecionando...",
        icon: <CheckCircle2 className="w-5 h-5 animate-pulse" />,
        disabled: true,
      };
    }
    if (loading) {
      return {
        text: "Entrando...",
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        disabled: true,
      };
    }
    return {
      text: "Entrar",
      icon: null,
      disabled: false,
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent 70%)",
          }}
        />
      </div>

      {/* Card de Login */}
      <div className="relative w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            FluxoCerto
          </h1>
          <p className="text-slate-400 mt-2">
            Entre para controlar suas finanças
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-8 shadow-2xl">
          {/* Mensagem de Erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* ✅ Mensagem de Sucesso/Redirecionamento */}
          {isRedirecting && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-400">
                Login realizado! Redirecionando...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
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
                // ✅ Bloqueia input durante loading OU redirecionamento
                disabled={loading || isRedirecting}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                placeholder="seu@email.com"
                // ✅ Previne autofill durante loading
                autoComplete={loading || isRedirecting ? "off" : "email"}
              />
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                // ✅ Bloqueia input durante loading OU redirecionamento
                disabled={loading || isRedirecting}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                placeholder="••••••••"
                // ✅ Previne autofill durante loading
                autoComplete={
                  loading || isRedirecting ? "off" : "current-password"
                }
              />
            </div>

            {/* Botão de Login - ✅ ESTADO DINÂMICO */}
            <button
              type="submit"
              disabled={buttonState.disabled}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-h-[48px]"
            >
              {buttonState.icon}
              <span>{buttonState.text}</span>
            </button>
          </form>

          {/* Link para Registro - ✅ Desabilitado durante loading */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Não tem uma conta?{" "}
              <Link
                href="/cadastro"
                className={`font-medium transition-colors ${
                  loading || isRedirecting
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-emerald-400 hover:text-emerald-300"
                }`}
                // ✅ Previne navegação durante loading
                onClick={(e) => {
                  if (loading || isRedirecting) {
                    e.preventDefault();
                  }
                }}
                tabIndex={loading || isRedirecting ? -1 : 0}
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          © 2026 FluxoCerto. Controle financeiro inteligente.
        </p>
      </div>
    </div>
  );
}
