"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

interface PluggyConnectProps {
  onSuccess: (data: { item: { id: string } }) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PluggyConnect: any;
  }
}

export function PluggyConnect({ onSuccess, onClose }: PluggyConnectProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/bank/connect", { method: "POST" });
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
        } else {
          throw new Error(data.error || "Erro ao gerar token de conexão");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, []);

  const initPluggy = () => {
    if (token && window.PluggyConnect) {
      const pluggyConnect = new window.PluggyConnect({
        connectToken: token,
        includeSandbox: true, // Habilitar Sandbox para teste
        onSuccess: (itemData: any) => {
          console.log("Pluggy Success:", itemData);
          onSuccess(itemData);
        },
        onError: (error: any) => {
          console.error("Pluggy Error:", error);
          setError("Erro na conexão com o banco");
        },
        onClose: () => {
          onClose();
        },
      });

      pluggyConnect.init();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
      
      <Script 
        src="https://cdn.pluggy.ai/pluggy-connect/v2/index.js" 
        onLoad={initPluggy}
      />

      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-emerald-500/30 p-8 text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        {loading ? (
          <>
            <div className="relative w-20 h-20 mx-auto">
              <Loader2 className="w-20 h-20 text-emerald-500 animate-spin opacity-20" />
              <ShieldCheck className="absolute inset-0 m-auto w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Iniciando Túnel Seguro</h2>
              <p className="text-sm text-slate-400 font-medium">Neuro está preparando a ponte criptografada com o seletor bancário...</p>
            </div>
          </>
        ) : error ? (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-red-400">Falha na Conexão</h2>
              <p className="text-sm text-slate-400">{error}</p>
              <button 
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-none border border-slate-700 hover:bg-slate-700 transition-all font-bold"
              >
                Tentar mais tarde
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-none flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Conexão Pronta</h2>
              <p className="text-sm text-slate-400">O seletor Pluggy será aberto em instantes. Siga as instruções para conectar seu banco com segurança total.</p>
            </div>
            <div className="h-2 w-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 animate-progress origin-left" style={{ width: '100%' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
