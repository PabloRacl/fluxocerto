import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Activity, Plus, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/componentes/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/componentes/ui/tooltip";
import { MascoteNeural } from "./MascoteNeural";

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

export function CartoesResumo({ loading, summary, userLevel = 1 }: SummaryCardsProps) {
  const router = useRouter();

  const getHealthColor = (score: number = 0) => {
    if (score >= 80) return { text: "text-emerald-400", glow: "rgba(52,211,153,0.4)", border: "border-emerald-500/40", bg: "bg-emerald-500/10", label: "Excelente" };
    if (score >= 50) return { text: "text-yellow-400", glow: "rgba(250,204,21,0.4)", border: "border-yellow-500/40", bg: "bg-yellow-500/10", label: "Regular" };
    return { text: "text-red-400", glow: "rgba(248,113,113,0.4)", border: "border-red-500/40", bg: "bg-red-500/10", label: "Crítico" };
  };

  const health = getHealthColor(summary.healthScore);

  // Card Neural base com gradiente e brilho
  const NeuralCard = ({
    children,
    onClick,
    accentColor,
    glowColor,
    hoverBorder,
    id,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    accentColor: string;
    glowColor: string;
    hoverBorder: string;
    id: string;
  }) => (
    <motion.div
      id={id}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`relative bg-slate-950/60 backdrop-blur-2xl rounded-2xl p-4 border border-slate-800/80 cursor-pointer transition-all duration-300 ${hoverBorder} overflow-hidden group/card shadow-lg`}
      style={{ boxShadow: `0 0 0 0 ${glowColor}` }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px 2px ${glowColor}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${glowColor}`;
      }}
    >
      {/* Linha de acento neon na base do card */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${accentColor} opacity-60 group-hover/card:opacity-100 transition-opacity`} />
      {/* Glow no canto superior direito */}
      <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-2xl opacity-30 group-hover/card:opacity-60 transition-all"
        style={{ backgroundColor: glowColor }} />
      {children}
    </motion.div>
  );

  const AddButton = ({ onClick, color }: { onClick: (e: React.MouseEvent) => void; color: string }) => (
    <button
      onClick={onClick}
      className={`group/btn p-1.5 rounded-lg text-slate-500 hover:text-white transition-all ${color} hover:scale-110`}
      title="Cadastrar Novo"
    >
      <Plus className="w-4 h-4" />
    </button>
  );

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6" data-tour="resumo">

        {/* 1. Patrimônio */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NeuralCard
              id="card-patrimonio"
              onClick={() => router.push('/painel/contas')}
              accentColor="bg-gradient-to-r from-emerald-500 to-teal-400"
              glowColor="rgba(16,185,129,0.25)"
              hoverBorder="hover:border-emerald-500/40"
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/15 rounded-lg border border-emerald-500/20">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Patrimônio</span>
                </div>
                <AddButton onClick={(e) => { e.stopPropagation(); router.push('/painel/contas?novo=true'); }} color="hover:bg-emerald-500/20" />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-full bg-slate-700/50" />
              ) : (
                <>
                  <p className="text-xl font-black text-emerald-400 relative z-10 leading-tight"
                    style={{ textShadow: "0 0 20px rgba(52,211,153,0.5)" }}>
                    {formatCurrency(summary.totalBalance)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Em todas as contas</p>
                </>
              )}
            </NeuralCard>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-white">Gerenciar Contas e Cartões</TooltipContent>
        </Tooltip>

        {/* 2. Receitas */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NeuralCard
              id="card-receitas"
              onClick={() => router.push('/painel/transacoes?type=INCOME')}
              accentColor="bg-gradient-to-r from-blue-500 to-cyan-400"
              glowColor="rgba(59,130,246,0.25)"
              hoverBorder="hover:border-blue-500/40"
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/15 rounded-lg border border-blue-500/20">
                    <ArrowUpCircle className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Receitas</span>
                </div>
                <AddButton onClick={(e) => { e.stopPropagation(); router.push('/painel/transacoes?drawer=open&type=INCOME'); }} color="hover:bg-blue-500/20" />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-full bg-slate-700/50" />
              ) : (
                <>
                  <p className="text-xl font-black text-blue-400 relative z-10 leading-tight"
                    style={{ textShadow: "0 0 20px rgba(96,165,250,0.5)" }}>
                    {formatCurrency(summary.totalIncome)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Entradas do mês</p>
                </>
              )}
            </NeuralCard>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-white">Ver Receitas ou + nova Receita</TooltipContent>
        </Tooltip>

        {/* 3. Despesas */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NeuralCard
              id="card-despesas"
              onClick={() => router.push('/painel/transacoes?type=EXPENSE')}
              accentColor="bg-gradient-to-r from-red-500 to-rose-400"
              glowColor="rgba(239,68,68,0.25)"
              hoverBorder="hover:border-red-500/40"
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-500/15 rounded-lg border border-red-500/20">
                    <ArrowDownCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Despesas</span>
                </div>
                <AddButton onClick={(e) => { e.stopPropagation(); router.push('/painel/transacoes?drawer=open&type=EXPENSE'); }} color="hover:bg-red-500/20" />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-full bg-slate-700/50" />
              ) : (
                <>
                  <p className="text-xl font-black text-red-400 relative z-10 leading-tight"
                    style={{ textShadow: "0 0 20px rgba(248,113,113,0.5)" }}>
                    {formatCurrency(summary.totalExpense)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Saídas do mês</p>
                </>
              )}
            </NeuralCard>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-white">Ver Despesas ou + nova Despesa</TooltipContent>
        </Tooltip>

        {/* 4. Saldo do Mês */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NeuralCard
              id="card-saldo"
              onClick={() => router.push('/painel/transacoes')}
              accentColor={summary.monthlyBalance >= 0 ? "bg-gradient-to-r from-emerald-500 to-green-400" : "bg-gradient-to-r from-red-500 to-orange-400"}
              glowColor={summary.monthlyBalance >= 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}
              hoverBorder={summary.monthlyBalance >= 0 ? "hover:border-emerald-500/40" : "hover:border-red-500/40"}
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${summary.monthlyBalance >= 0 ? "bg-emerald-500/15 border-emerald-500/20" : "bg-red-500/15 border-red-500/20"}`}>
                    {summary.monthlyBalance >= 0
                      ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                      : <TrendingDown className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Saldo Mês</span>
                </div>
                <AddButton onClick={(e) => { e.stopPropagation(); router.push('/painel/transacoes?drawer=open'); }} color="hover:bg-emerald-500/20" />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-full bg-slate-700/50" />
              ) : (
                <>
                  <p className={`text-xl font-black relative z-10 leading-tight ${summary.monthlyBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    style={{ textShadow: summary.monthlyBalance >= 0 ? "0 0 20px rgba(52,211,153,0.5)" : "0 0 20px rgba(248,113,113,0.5)" }}>
                    {formatCurrency(summary.monthlyBalance)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {summary.monthlyBalance >= 0 ? "Saldo positivo" : "Déficit mensal"}
                  </p>
                </>
              )}
            </NeuralCard>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-white">Resumo do Saldo do Mês</TooltipContent>
        </Tooltip>

        {/* 5. Saúde Financeira */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NeuralCard
              id="card-saude"
              onClick={() => router.push('/painel/metas')}
              accentColor={`bg-gradient-to-r ${(summary.healthScore ?? 0) >= 80 ? "from-emerald-500 to-teal-400" : (summary.healthScore ?? 0) >= 50 ? "from-yellow-500 to-amber-400" : "from-red-500 to-rose-400"}`}
              glowColor={health.glow}
              hoverBorder={`hover:${health.border}`}
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${health.bg} ${health.border}`}>
                    <Activity className={`w-4 h-4 ${health.text}`} />
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Saúde</span>
                </div>
                <AddButton onClick={(e) => { e.stopPropagation(); router.push('/painel/metas?novo=true'); }} color="hover:bg-emerald-500/20" />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-full bg-slate-700/50" />
              ) : (
                <>
                  <div className="flex items-baseline gap-1.5 relative z-10">
                    <p className={`text-xl font-black leading-tight ${health.text}`}
                      style={{ textShadow: `0 0 20px ${health.glow}` }}>
                      {summary.healthScore ?? 0}
                    </p>
                    <span className="text-[10px] text-slate-500 font-black uppercase">pts</span>
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${health.text} opacity-80`}>{health.label}</p>
                </>
              )}

              {/* Mini Mascote */}
              {!loading && (
                <div className="absolute -right-3 -bottom-3 opacity-70 group-hover/card:opacity-100 transition-opacity z-20">
                  <MascoteNeural
                    mood={(summary.healthScore ?? 0) >= 70 ? "HAPPY" : "WORRIED"}
                    size="sm"
                    showScan={false}
                    level={userLevel}
                  />
                </div>
              )}
            </NeuralCard>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700 text-white">Saúde Financeira e Metas</TooltipContent>
        </Tooltip>

      </div>
    </TooltipProvider>
  );
}
