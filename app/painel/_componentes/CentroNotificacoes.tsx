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
          <div className="absolute right-0 mt-4 w-80 md:w-96 bg-slate-950/80 border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Glow Interno */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none" />

            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50 relative z-10">
              <h3 className="font-black text-white text-xs uppercase tracking-widest">Notificações</h3>
              {unreadCount > 0 && (
                <span className="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-lg uppercase font-black tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  {unreadCount} Novas
                </span>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto relative z-10">
              {notificationList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 relative">
                   <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                     <Bell className="w-8 h-8 text-slate-700" />
                   </div>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Sinal Limpo</p>
                </div>
              ) : (
                notificationList.map((n) => {
                  const tone = getNotificationTone(n.tipo);
                  const toneClasses =
                    tone === "warning"
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      : tone === "success"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20";

                  const Icon =
                    tone === "warning" ? AlertTriangle : tone === "success" ? CheckCircle : Info;

                  return (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b transition-colors relative group ${!n.lido ? 'bg-blue-500/5 border-white/10' : 'bg-transparent border-white/5 hover:bg-white/[0.02]'}`}
                  >
                    <div className="flex gap-4">
                      <div className={`mt-1 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                        toneClasses
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                           <h4 className={`text-xs font-black uppercase tracking-wide truncate ${!n.lido ? 'text-white' : 'text-slate-400'}`}>{n.titulo}</h4>
                           {!n.lido && (
                              <button 
                                onClick={() => markAsRead(n.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg transition-all text-blue-400 ml-1 shrink-0"
                                title="Marcar como lida"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                           )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{n.mensagem}</p>
                        <div className="text-[9px] text-slate-600 mt-2 font-black uppercase tracking-tighter">
                          {format(new Date(n.criadoEm), "dd MMM, HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-950/80 border-t border-white/5 text-center relative z-10">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  router.push("/painel/notificacoes");
                }}
                className="text-[10px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-widest transition-colors w-full py-1"
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
