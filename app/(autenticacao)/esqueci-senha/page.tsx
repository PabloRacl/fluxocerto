"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/app/_componentes/BrandLogo";
import { Mail, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [debugLink, setDebugLink] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const data = await res.json();
        setSent(true);
        if (data.debugLink) setDebugLink(data.debugLink);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao solicitar recuperação");
      }
    } catch {
      setError("Falha na conexão neural.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-md rounded-3xl border border-blue-500/30 shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <BrandLogo size="lg" className="justify-center mb-4" />
          <h2 className="text-xl font-bold text-white">Recuperação Neural</h2>
          <p className="text-slate-400 text-sm mt-2">
            Insira seu e-mail para receber o link de redefinição de segurança.
          </p>
        </div>

        {sent ? (
          <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
               <Send className="w-8 h-8 text-blue-400" />
            </div>
            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-blue-200 text-sm">
              Se o e-mail estiver cadastrado, você receberá instruções em instantes. Verifique também sua caixa de spam.
            </div>

            {debugLink && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-pulse">
                <p className="text-[10px] text-emerald-500 uppercase font-black mb-2">Protocolo Debug Ativo</p>
                <Link 
                  href={debugLink}
                  className="text-xs text-white underline hover:text-emerald-400 break-all"
                >
                  Confirmar Acesso: {debugLink}
                </Link>
              </div>
            )}
            <Link 
              href="/entrar"
              className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
            >
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                E-mail de Cadastro
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {loading ? "Processando..." : "Enviar Link de Recuperação"}
            </button>

            <Link 
              href="/entrar"
              className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors pt-2"
            >
               <ArrowLeft className="w-4 h-4" /> Voltar para o Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
