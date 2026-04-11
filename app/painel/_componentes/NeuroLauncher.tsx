"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, X, Zap, CreditCard, Wallet, 
  ArrowUpRight, ArrowDownLeft, Landmark, 
  Sparkles, ShieldCheck, AlertCircle,
  Command, ChevronRight, Import, PlusCircle
} from "lucide-react";
import { MascoteNeural } from "./MascoteNeural";
import { useRouter } from "next/navigation";

import useSWR from "swr";
import { api } from "@/biblioteca/http-client";

interface NeuroLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NeuroLauncher({ isOpen, onClose }: NeuroLauncherProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Usar SWR para puxar o resumo global já cacheado no layout
  const { data: summaryData } = useSWR(isOpen ? "/api/painel/resumo" : null, (url) => api.get<any>(url));
  
  // Tratar os dados ou cair no fallback seguro
  const totalBalance = summaryData?.resumo?.balance || 0;
  
  // Usaremos um mock refinado APENAS se a API não retornar boletos ou faturas, para manter a aura neuro, 
  // mas vamos condicionar isso ao retorno real
  const [alerts, setAlerts] = useState<any[]>([]);

  // Atalho Teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new CustomEvent("open-neuro-launcher"));
      }
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onClose]);

  // Carregar alertas simulados ou reais no mount para a IA do launcher
  useEffect(() => {
    if (isOpen) {
      if (summaryData?.transacoes) {
        // Logica para gerar alertas reais baseados nas transações pendentes ou atrasadas
        const transacoesAtrasadas = summaryData.transacoes.filter((t: any) => t.isPaid === false && new Date(t.date) < new Date());
        
        if (transacoesAtrasadas.length > 0) {
           setAlerts([{ id: 1, type: "OVERDUE", bank: "Aviso do Sistema", amount: transacoesAtrasadas.reduce((sum: number, t: any) => sum + t.amount, 0), dueDate: "Atrasado", critical: true }]);
        } else {
           setAlerts([{ id: 1, type: "LIMIT", bank: "Saúde Financeira", message: "Fluxo sob controle", critical: false }]);
        }
      } else {
         // Fallback Visual até backend ter dados reais de contas
         setAlerts([
            { id: 1, type: "INVOICE", bank: "Nubank", amount: 154090, dueDate: "Amanhã", critical: true },
            { id: 2, type: "LIMIT", bank: "Itaú", message: "Limite saudável (15%)", critical: false },
         ]);
      }
    }
  }, [isOpen, summaryData]);

  const hasCriticalAlert = alerts.some(a => a.critical);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Overlay Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Launcher Container Neural */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-slate-950/80 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col md:flex-row h-[600px] max-h-[85vh] border border-emerald-500/30 backdrop-blur-3xl"
      >
        {/* Glow animado no fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-emerald-500/20 blur-[100px] pointer-events-none rounded-full" />
        {/* Linha de Scanner que desce */}
        <motion.div 
          animate={{ top: ["-10%", "110%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[2px] bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,1)] z-50 opacity-20 pointer-events-none"
        />

        {/* Lado Esquerdo: HUD Financeiro (Neuro-HUD Style) */}
        <div className="relative w-full md:w-80 bg-slate-900/40 border-r border-white/5 p-6 flex flex-col items-center">
          <MascoteNeural size="lg" mood={hasCriticalAlert ? "SAD" : "HAPPY"} className="mb-6 z-10 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          
          <div className="w-full space-y-6 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Saldo Consolidado</span>
              <div className="text-3xl font-mono font-bold text-white tracking-tighter">
                R$ {(totalBalance / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Alertas Críticos</span>
              {alerts.map(alert => (
                <div key={alert.id} className={`p-3 border-[1px] ${alert.critical ? 'border-red-500/50 bg-red-500/5' : 'border-emerald-500/50 bg-emerald-500/5'} flex items-start gap-3 relative overflow-hidden group rounded-lg`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${alert.critical ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  {alert.critical ? <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" /> : <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">{alert.bank}</p>
                    <p className="text-[10px] text-slate-400 truncate">{alert.type === 'INVOICE' || alert.type === 'OVERDUE' ? `Vencimento: ${alert.dueDate}` : alert.message}</p>
                  </div>
                  {(alert.type === 'INVOICE' || alert.type === 'OVERDUE') && (
                    <span className="text-[10px] font-mono text-white">R$ {(alert.amount/100).toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto w-full pt-6 border-t border-emerald-500/10">
            <div className={`flex items-center gap-2 text-[10px] font-mono ${hasCriticalAlert ? 'text-red-400' : 'text-emerald-500/60'}`}>
              <Command className="w-3 h-3" />
              <span>🐸 Mestre Dino | {hasCriticalAlert ? "Atenção necessária em suas contas!" : "Operação Segura. Tudo em ordem!"}</span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Busca e Atalhos */}
        <div className="flex-1 flex flex-col bg-slate-950/40">
          <div className="p-6 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
              <input 
                autoFocus
                className="w-full bg-transparent border-none text-xl text-white placeholder-slate-600 focus:ring-0 pl-10 font-bold"
                placeholder="O que vamos fazer hoje?"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-8">
            {/* Quick Actions Sections */}
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-widest text-emerald-500/60 font-black">Comandos Rápidos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LauncherButton 
                  icon={<Landmark className="w-5 h-5" />}
                  title="Conectar Banco"
                  desc="Pluggy Open Finance"
                  onClick={() => router.push("/painel/contas?action=connect")}
                />
                <LauncherButton 
                  icon={<Import className="w-5 h-5" />}
                  title="Importar Dados"
                  desc="CSV, OFX ou NF-e"
                  onClick={() => router.push("/painel/transacoes/importar")}
                />
                <LauncherButton 
                  icon={<PlusCircle className="w-5 h-5" />}
                  title="Nova Transação"
                  desc="Gasto ou Receita manual"
                  onClick={() => router.push("/painel/transacoes?new=true")}
                />
                <LauncherButton 
                  icon={<CreditCard className="w-5 h-5" />}
                  title="Ver Faturas"
                  desc="Controle de cartões"
                  onClick={() => router.push("/painel/contas?type=credit")}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Navegação Direta</h3>
              <div className="grid grid-cols-2 space-y-1">
                {['Dashboard', 'Relatórios', 'Categorias', 'Contas', 'Metas', 'Configurações'].map(link => (
                  <button key={link} className="flex items-center gap-2 group p-2 rounded hover:bg-white/5 transition-all">
                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-500" />
                    <span className="text-sm font-medium text-slate-400 group-hover:text-white">{link}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer / Info */}
          <div className="p-4 bg-emerald-500/5 border-t border-emerald-500/10 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                   <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-white">Esc</kbd>
                   <span className="text-[10px] text-slate-500">Sair</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-white">Enter</kbd>
                   <span className="text-[10px] text-slate-500">Executar</span>
                </div>
             </div>
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">NEURO SUGERE: CONECTE SEU NUBANK</span>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LauncherButton({ icon, title, desc, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-slate-800/30 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
      </div>
      <div className="p-2 bg-slate-900 border border-white/5 group-hover:border-emerald-500/30 text-emerald-500 transition-colors">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{title}</h4>
        <p className="text-[10px] text-slate-500 leading-none">{desc}</p>
      </div>
    </button>
  );
}
