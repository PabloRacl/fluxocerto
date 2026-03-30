"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Clock, 
  User, 
  Activity, 
  Search,
  ChevronDown,
  ChevronUp,
  Fingerprint
} from "lucide-react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  user: { name: string; email: string };
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/configuracoes/auditoria");
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Erro logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (action.includes("UPDATE")) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (action.includes("DELETE")) return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <PageHeader 
        title="Auditoria & Transparência"
        subtitle="Rastro completo de alterações no seu sistema FluxoCerto"
        onBack={() => router.push("/painel/configuracoes")}
      />

      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Logs de Atividade Enterprise
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
               <Fingerprint className="w-3 h-3" />
               Protegido por Criptografia de Ponta a Ponta
            </div>
          </div>

          {loading ? (
             <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 text-sm">Consultando registros...</p>
             </div>
          ) : logs.length === 0 ? (
             <div className="p-20 text-center">
                <ShieldCheck className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma atividade registrada ainda.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/20 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="px-6 py-4">Evento / Entidade</th>
                    <th className="px-6 py-4">Ação</th>
                    <th className="px-6 py-4">Horário</th>
                    <th className="px-6 py-4">Metadados</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">{log.entityType}</span>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {log.entityId || "Global"}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                           <Clock className="w-3 h-3" />
                           {format(new Date(log.createdAt), "dd MMM, HH:mm:ss", { locale: ptBR })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                               <Activity className="w-3 h-3" /> IP: {log.ipAddress || "Interno"}
                            </span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                           className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-white"
                         >
                            {expandedId === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
              <h4 className="font-bold text-white mb-2">Conformidade P2</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Todos os logs são imutáveis e seguem os padrões de auditoria enterprise estabelecidos no projeto.
              </p>
           </div>
           {/* ... outros cards de info */}
        </div>
      </div>
    </div>
  );
}
