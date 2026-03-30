import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Activity, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/componentes/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/componentes/ui/tooltip";
import { NeuralMascot } from "./NeuralMascot";

interface SummaryCardsProps {
  loading: boolean;
  summary: {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    monthlyBalance: number;
    healthScore?: number;
    healthStatus?: string;
  };
  userLevel?: number;
}

const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};

export function SummaryCards({ loading, summary, userLevel = 1 }: SummaryCardsProps) {
  const router = useRouter();

  const getHealthColor = (score: number = 0) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  // Botão reutilizável com animação de "mais subindo"
  const AnimatedAddButton = ({ 
    onClick, 
    hoverBg, 
    hoverText 
  }: { 
    onClick: (e: React.MouseEvent) => void, 
    hoverBg: string, 
    hoverText: string 
  }) => (
    <button 
      onClick={onClick}
      className={`group relative p-1.5 rounded-lg text-slate-500 transition-all duration-300 ${hoverBg} ${hoverText}`}
      title="Cadastrar Novo"
    >
      <div className="relative overflow-hidden w-4 h-4 flex items-center justify-center">
        {/* Ícone que sobe e desaparece */}
        <Plus className="w-4 h-4 absolute inset-0 transform transition-transform duration-300 ease-out group-hover:-translate-y-full group-hover:opacity-0" />
        {/* Novo ícone que vem de baixo */}
        <Plus className="w-4 h-4 absolute inset-0 transform translate-y-full opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100" />
      </div>
    </button>
  );
 
  // Componente de Linha de Scan Laser
  const LaserScan = () => (
    <motion.div 
      initial={{ top: "-100%" }}
      whileHover={{ top: "100%" }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent blur-[1px] z-20 pointer-events-none"
    />
  );

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => router.push('/painel/contas')}
              className="bg-slate-950/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 cursor-pointer transition-all hover:bg-slate-900/60 hover:border-emerald-500/30 relative overflow-hidden group/card"
            >
              <LaserScan />
              {/* Aura de Fundo */}
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full group-hover/card:bg-emerald-500/20 transition-all" />

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-sm text-slate-400 font-medium">Patrimônio em Contas</span>
                <div className="flex items-center gap-2">
                  <AnimatedAddButton 
                    onClick={(e) => { e.stopPropagation(); router.push('/painel/contas?novo=true'); }} 
                    hoverBg="hover:bg-emerald-500/20" 
                    hoverText="hover:text-emerald-400" 
                  />
                  <Wallet className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-full bg-slate-700/50" />
              ) : (
                <p className={`text-xl font-black relative z-10 ${summary.totalBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatCurrency(summary.totalBalance)}
                </p>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
            <p>Clique no card para Gerenciar Contas e Cartões, ou em + para nova Conta</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => router.push('/painel/transacoes?type=INCOME')}
              className="bg-slate-950/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 cursor-pointer transition-all hover:bg-slate-900/60 hover:border-blue-500/30 relative overflow-hidden group/card"
            >
              <LaserScan />
               {/* Aura de Fundo */}
               <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full group-hover/card:bg-blue-500/20 transition-all" />

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-sm text-slate-400 font-medium">Receitas do Mês</span>
                <div className="flex items-center gap-2">
                  <AnimatedAddButton 
                    onClick={(e) => { e.stopPropagation(); router.push('/painel/transacoes?drawer=open&type=INCOME'); }} 
                    hoverBg="hover:bg-blue-500/20" 
                    hoverText="hover:text-blue-400" 
                  />
                  <ArrowUpCircle className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-full bg-slate-700/50" />
              ) : (
                <p className="text-xl font-black text-blue-400 relative z-10">
                  {formatCurrency(summary.totalIncome)}
                </p>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
            <p>Clique no card para Relatório de Receitas, ou em + para nova Receita</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => router.push('/painel/transacoes?type=EXPENSE')}
              className="bg-slate-950/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 cursor-pointer transition-all hover:bg-slate-900/60 hover:border-red-500/30 relative overflow-hidden group/card"
            >
              <LaserScan />
               {/* Aura de Fundo */}
               <div className="absolute -right-8 -top-8 w-24 h-24 bg-red-500/10 blur-3xl rounded-full group-hover/card:bg-red-500/20 transition-all" />

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-sm text-slate-400 font-medium">Despesas do Mês</span>
                <div className="flex items-center gap-2">
                  <AnimatedAddButton 
                    onClick={(e) => { e.stopPropagation(); router.push('/painel/transacoes?drawer=open&type=EXPENSE'); }} 
                    hoverBg="hover:bg-red-500/20" 
                    hoverText="hover:text-red-400" 
                  />
                  <ArrowDownCircle className="w-5 h-5 text-red-500" />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-full bg-slate-700/50" />
              ) : (
                <p className="text-xl font-black text-red-400 relative z-10">
                  {formatCurrency(summary.totalExpense)}
                </p>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
            <p>Clique no card para Relatório de Despesas, ou em + para nova Despesa</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => router.push('/painel/transacoes')}
              className="bg-slate-950/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 cursor-pointer transition-all hover:bg-slate-900/60 hover:border-emerald-500/30 relative overflow-hidden group/card"
            >
              <LaserScan />
               {/* Aura de Fundo */}
               <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full group-hover/card:bg-emerald-500/20 transition-all" />

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-sm text-slate-400 font-medium">Saldo do Mês</span>
                <div className="flex items-center gap-2">
                  <AnimatedAddButton 
                    onClick={(e) => { e.stopPropagation(); router.push('/painel/transacoes?drawer=open'); }} 
                    hoverBg="hover:bg-emerald-500/20" 
                    hoverText="hover:text-emerald-400" 
                  />
                  {summary.monthlyBalance >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-full bg-slate-700/50" />
              ) : (
                <p className={`text-xl font-black relative z-10 ${summary.monthlyBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatCurrency(summary.monthlyBalance)}
                </p>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
            <p>Clique no card para ver Transações, ou em + para nova Transação Geral</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => router.push('/painel/metas')}
              className="group/card bg-slate-950/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 cursor-pointer transition-all hover:bg-slate-900/60 hover:border-emerald-500/30 relative overflow-hidden"
            >
              <LaserScan />
               {/* Aura de Fundo */}
               <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full group-hover/card:bg-emerald-500/20 transition-all" />

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-sm text-slate-400 font-medium">Saúde Financeira</span>
                <div className="flex items-center gap-2">
                  <AnimatedAddButton 
                    onClick={(e) => { e.stopPropagation(); router.push('/painel/metas?novo=true'); }} 
                    hoverBg="hover:bg-emerald-500/20" 
                    hoverText="hover:text-emerald-400" 
                  />
                  <Activity className={`w-5 h-5 ${getHealthColor(summary.healthScore)}`} />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-full bg-slate-700/50" />
              ) : (
                <div className="flex items-baseline gap-2 relative z-10">
                   <p className={`text-xl font-black ${getHealthColor(summary.healthScore)}`}>
                    {summary.healthScore ?? 0}
                  </p>
                  <span className="text-[10px] text-slate-500 font-black uppercase">pts</span>
                </div>
              )}

              {/* Mini Mascote 3D de Saúde (Neural Guide) */}
              {!loading && (
                <div className="absolute -right-3 -bottom-3 opacity-80 group-hover/card:opacity-100 transition-opacity z-20">
                  <NeuralMascot 
                    mood={(summary.healthScore ?? 0) >= 70 ? "HAPPY" : "WORRIED"} 
                    size="sm" 
                    showScan={false} 
                    level={userLevel}
                  />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
            <p>Clique no card para Metas, ou em + para definir uma nova Meta</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
