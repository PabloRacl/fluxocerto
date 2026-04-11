"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";
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
    return <NeuralLoading message="Escaneando Central de Alertas..." variant="full" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PageHeader
        title="Notificações"
        subtitle={naoLidas > 0 ? `${naoLidas} não lida(s)` : "Tudo em dia!"}
        onRefresh={fetchNotificacoes}
        showFilters
        filters={
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setFiltro("TODAS")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${filtro === "TODAS" ? "bg-emerald-600 text-white" : "text-slate-400"}`}
              >
                <Bell className="w-3 h-3" />
                Todas
              </button>
              <button
                onClick={() => setFiltro("NAO_LIDAS")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${filtro === "NAO_LIDAS" ? "bg-blue-600 text-white" : "text-slate-400"}`}
              >
                <BellOff className="w-3 h-3" />
                Não Lidas {naoLidas > 0 && `(${naoLidas})`}
              </button>
            </div>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"
              >
                <CheckCheck className="w-3 h-3" /> Marcar todas
              </button>
            )}
          </div>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <NeuralLoading message="Sincronizando Alertas..." variant="card" />
        )}

        {!loading && notificacoes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <BellOff className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-slate-400">
              Você será notificado sobre vencimentos, metas e alertas aqui
            </p>
          </div>
        )}

        {!loading && notificacoes.length > 0 && (
          <div className="space-y-2">
            {notificacoes.map((notif) => {
              const tipoConfig = TIPO_ICONS[notif.tipo] || TIPO_ICONS.GERAL;
              const Icon = tipoConfig.icon;

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.lido && marcarLida(notif.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                    notif.lido
                      ? "bg-slate-900/30 border-slate-800/50 opacity-60"
                      : "bg-slate-900/80 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${tipoConfig.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${tipoConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm font-medium ${notif.lido ? "text-slate-400" : "text-white"}`}
                      >
                        {notif.titulo}
                      </h3>
                      {!notif.lido && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                      )}
                    </div>
                    {notif.mensagem && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                        {notif.mensagem}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {TIPO_LABELS[notif.tipo] || notif.tipo}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(notif.criadoEm).toLocaleDateString("pt-BR")}{" "}
                        às{" "}
                        {new Date(notif.criadoEm).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
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
