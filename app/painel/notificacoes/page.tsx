"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CabecalhoPagina } from "@/app/painel/_componentes/CabecalhoPagina";
import { CarregamentoNeural } from "@/app/painel/_componentes/CarregamentoNeural";
import { api } from "@/biblioteca/http-client";
import {
  Bell,
  BellOff,
  CheckCheck,
  CreditCard,
  Target,
  Calendar,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Wallet,
} from "lucide-react";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string | null;
  tipo: string;
  lido: boolean;
  lidoEm: string | null;
  criadoEm: string;
  referenciaId: string | null;
  referenciaTipo: string | null;
}

const TIPO_ICONS: Record<string, any> = {
  VENCIMENTO_DIVIDA: {
    icon: TrendingDown,
    color: "text-red-400",
    bg: "bg-red-500/20",
  },
  ALERTA_ORCAMENTO: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
  },
  RENOVACAO_ASSINATURA: {
    icon: RefreshCw,
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
  },
  PROGRESSO_META: {
    icon: Target,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
  VENCIMENTO_TRANSACAO: {
    icon: Calendar,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
  },
  ALERTA_LIMITE_CARTAO: {
    icon: CreditCard,
    color: "text-orange-400",
    bg: "bg-orange-500/20",
  },
  GERAL: { icon: Bell, color: "text-slate-400", bg: "bg-slate-500/20" },
};

const TIPO_LABELS: Record<string, string> = {
  VENCIMENTO_DIVIDA: "Vencimento de Dívida",
  ALERTA_ORCAMENTO: "Alerta de Orçamento",
  RENOVACAO_ASSINATURA: "Renovação de Assinatura",
  PROGRESSO_META: "Progresso de Meta",
  VENCIMENTO_TRANSACAO: "Vencimento de Transação",
  ALERTA_LIMITE_CARTAO: "Alerta de Cartão",
  GERAL: "Notificação Geral",
};

export default function NotificacoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"TODAS" | "NAO_LIDAS">("TODAS");

  const fetchNotificacoes = useCallback(async () => {
    try {
      setLoading(true);

      // Gerar notificações automáticas primeiro
      await fetch("/api/notificacoes/gerar", {
        method: "POST",
        credentials: "include",
      }).catch(() => {}); // Ignorar erros de geração

      const params = new URLSearchParams();
      if (filtro === "NAO_LIDAS") params.set("apenasNaoLidas", "true");

      const data = await api.get<{ notificacoes: Notificacao[]; naoLidas: number }>(
        `/api/notificacoes?${params.toString()}`,
      );
      setNotificacoes(data.notificacoes || []);
      setNaoLidas(data.naoLidas || 0);
    } catch {
      console.error("Erro ao buscar notificações");
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }
    if (status === "authenticated") fetchNotificacoes();
  }, [status, router, fetchNotificacoes]);

  const marcarLida = async (id: string) => {
    try {
      await api.patch("/api/notificacoes", { ids: [id] });
      fetchNotificacoes();
    } catch {}
  };

  const marcarTodasLidas = async () => {
    try {
      await api.patch("/api/notificacoes", { marcarTodas: true });
      fetchNotificacoes();
    } catch {}
  };

  if (status === "loading") {
    return <CarregamentoNeural message="Escaneando Central de Alertas..." variant="full" />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <CabecalhoPagina
        title="Central Neural"
        subtitle={naoLidas > 0 ? `${naoLidas} evento(s) pendente(s)` : "Sistemas operando normalmente"}
        breadcrumbs={[
          { label: "Painel", href: "/painel" },
          { label: "Notificações" }
        ]}
        onRefresh={fetchNotificacoes}
        showFilters
        filters={
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900/80 border border-slate-800 rounded-xl p-1 backdrop-blur-md relative z-20">
              <button
                onClick={() => setFiltro("TODAS")}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${filtro === "TODAS" ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/10" : "text-slate-500 hover:text-white"}`}
              >
                <Bell className="w-3 h-3" />
                Log Completo
              </button>
              <button
                onClick={() => setFiltro("NAO_LIDAS")}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${filtro === "NAO_LIDAS" ? "bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-blue-500/30" : "text-slate-500 hover:text-white"}`}
              >
                <BellOff className="w-3 h-3" />
                Pendentes {naoLidas > 0 && `(${naoLidas})`}
              </button>
            </div>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:scale-105"
              >
                <CheckCheck className="w-4 h-4" /> Resetar Alertas
              </button>
            )}
          </div>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Glow de fundo (Neuro style) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        {loading && (
          <CarregamentoNeural message="Sincronizando Nódulos de Alerta..." variant="card" />
        )}

        {!loading && notificacoes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 relative">
            <div className="w-32 h-32 bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
               <BellOff className="w-12 h-12 text-slate-700" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">
              Sinal Limpo
            </h3>
            <p className="text-slate-500 text-sm font-medium tracking-wide">
              Não há anomalias no sistema no momento
            </p>
          </div>
        )}

        {!loading && notificacoes.length > 0 && (
          <div className="space-y-4 relative z-10">
            {notificacoes.map((notif) => {
              const tipoConfig = TIPO_ICONS[notif.tipo] || TIPO_ICONS.GERAL;
              const Icon = tipoConfig.icon;

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.lido && marcarLida(notif.id)}
                  className={`relative p-5 bg-slate-950/40 backdrop-blur-2xl rounded-3xl border transition-all duration-500 overflow-hidden cursor-pointer group ${
                    notif.lido
                      ? "border-white/5 opacity-50 blur-[0.5px] hover:blur-none"
                      : "border-white/10 hover:border-blue-500/30 shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:-translate-y-1"
                  }`}
                >
                  {/* Laser Scan Animation */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                    style={{ transform: "skewX(-20deg)" }}
                  />

                  <div className="flex items-start gap-5 relative z-10">
                    {/* Icone HUD */}
                    <div
                      className={`w-14 h-14 rounded-2xl ${tipoConfig.bg} flex items-center justify-center flex-shrink-0 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform duration-500`}
                    >
                      <Icon className={`w-6 h-6 ${tipoConfig.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <h3 className={`text-sm font-black uppercase tracking-wide ${notif.lido ? "text-slate-400" : "text-white group-hover:text-blue-400 transition-colors"}`}>
                          {notif.titulo}
                        </h3>
                        {/* Status Lida/NaoLida */}
                        <div className="flex items-center gap-2">
                          {!notif.lido ? (
                            <span className="flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/50">Resolvido</span>
                          )}
                        </div>
                      </div>

                      {notif.mensagem && (
                         <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                           <p className="text-xs text-slate-400 leading-relaxed font-medium">
                             {notif.mensagem}
                           </p>
                         </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-slate-500">
                          {TIPO_LABELS[notif.tipo] || notif.tipo}
                        </span>
                        <div className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-600 italic">
                          <span>{new Date(notif.criadoEm).toLocaleDateString("pt-BR")}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(notif.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Glow Line Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-800/30 overflow-hidden">
                     <div className={`h-full opacity-0 group-hover:opacity-100 transition-all duration-700 w-0 group-hover:w-full ${notif.lido ? 'bg-slate-600' : 'bg-blue-500'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
