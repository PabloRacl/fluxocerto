"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bell, BellRing, Check, X, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/biblioteca/http-client";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lido: boolean;
  criadoEm: string | Date;
};

const fetcher = async (url: string) => {
  return api.get<any>(url);
};

const getNotificationTone = (tipo: string): "warning" | "success" | "info" => {
  // `tipo` vem do enum `TipoLembrete` no Prisma (ex.: ALERTA_ORCAMENTO, ALERTA_ESTOQUE, etc)
  switch (tipo) {
    case "PROGRESSO_META":
      return "success";
    case "VENCIMENTO_DIVIDA":
    case "ALERTA_ORCAMENTO":
    case "RENOVACAO_ASSINATURA":
    case "VENCIMENTO_TRANSACAO":
    case "ALERTA_LIMITE_CARTAO":
    case "ALERTA_ESTOQUE":
    case "ALERTA_VALIDADE":
      return "warning";
    case "GERAL":
    default:
      return "info";
  }
};

export function CentroNotificacoes() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications, mutate } = useSWR("/api/notificacoes", fetcher);

  // P14: Disparar geração de notificações ao carregar o componente
  useState(() => {
    const triggerGerar = async () => {
      try {
        await fetch("/api/notificacoes/gerar", { method: "POST" });
        mutate(); // Revalida a lista após gerar
      } catch (err) {
        console.error("Erro ao disparar gerador de notificações:", err);
      }
    };
    triggerGerar();
  });

  const notificationList: Notification[] = Array.isArray(notifications)
    ? notifications
    : Array.isArray((notifications as any)?.data)
      ? (notifications as any).data
      : Array.isArray((notifications as any)?.notificacoes)
        ? (notifications as any).notificacoes
      : [];

  const unreadCount = notificationList.filter((n) => !n.lido).length;

  const markAsRead = async (id: string) => {
    await api.post("/api/notificacoes", { action: "read", id });
    mutate();
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all hover:border-slate-700"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-emerald-500 animate-pulse" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-80 md:w-96 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white">Notificações</h3>
              <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase font-bold tracking-widest">
                Proativo (P14)
              </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notificationList.length === 0 ? (
                <div className="p-12 text-center">
                   <Bell className="w-8 h-8 text-slate-800 mx-auto mb-3" />
                   <p className="text-sm text-slate-500 font-medium">Tudo certo por aqui!</p>
                </div>
              ) : (
                notificationList.map((n) => {
                  const tone = getNotificationTone(n.tipo);
                  const toneClasses =
                    tone === "warning"
                      ? "bg-amber-500/10 text-amber-500"
                      : tone === "success"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-blue-500/10 text-blue-400";

                  const Icon =
                    tone === "warning" ? AlertTriangle : tone === "success" ? CheckCircle : Info;

                  return (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-slate-800 hover:bg-slate-800/40 transition-colors relative group ${!n.lido ? 'bg-emerald-500/5' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        toneClasses
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <h4 className={`text-sm font-bold ${!n.lido ? 'text-white' : 'text-slate-400'}`}>{n.titulo}</h4>
                           {!n.lido && (
                              <button 
                                onClick={() => markAsRead(n.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all text-emerald-500"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                           )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.mensagem}</p>
                        <div className="text-[10px] text-slate-600 mt-2 font-medium uppercase tracking-tighter">
                          {format(new Date(n.criadoEm), "dd MMM, HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-950/50 text-center">
              <button 
                onClick={() => router.push("/painel/central-notificacoes")}
                className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Ver tudo na central ➔
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
