"use client";

import {
  Plus,
  TrendingUp,
  ArrowUpRight,
  Info,
  Wallet,
  PieChart,
  CreditCard,
  TrendingDown,
  ShoppingBag,
  Target,
  FileText,
  ArrowRight,
  Calculator,
  Clock,
  Zap,
  WalletIcon,
  TrendingUpIcon,
  PiggyBank,
  Bell,
  Settings,
  LucideIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface QuickActionsProps {
  onNewTransaction: () => void;
}

export function QuickActions({ onNewTransaction }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      title: "Transações",
      description: "Gerencie receitas e despesas",
      icon: TrendingUp,
      color: "emerald",
      href: "/painel/transacoes",
      customAction: onNewTransaction,
      tooltipTitle: "Gerenciador de Transações",
      tooltipDesc: "Crie, edite e acompanhe todas as suas receitas e despesas com filtros avançados.",
    },
    {
      title: "Contas Bancárias",
      description: "Gerencie contas, cartões e faturas",
      icon: Wallet,
      color: "blue",
      href: "/painel/contas",
      customAction: () => router.push("/painel/contas/nova"),
      tooltipTitle: "Contas Bancárias",
      tooltipDesc: "Cadastre contas bancárias e cartões de crédito. Acompanhe saldos, faturas, limites e alertas.",
    },
    {
      title: "Categorias",
      description: "Organize suas transações",
      icon: PieChart,
      color: "cyan",
      href: "/painel/categorias",
      customAction: () => router.push("/painel/categorias/nova"),
      tooltipTitle: "Categorias Personalizadas",
      tooltipDesc: "Crie e organize categorias para classificar suas receitas e despesas.",
    },
    {
      title: "Dívidas",
      description: "Financiamentos e parcelamentos",
      icon: CreditCard,
      color: "red",
      href: "/painel/dividas",
      customAction: () => router.push("/painel/dividas/nova"),
      tooltipTitle: "Dívidas Parceladas",
      tooltipDesc: "Gerencie financiamentos e empréstimos com barra de progresso, tabela de amortização SAC, PRICE e Fixa.",
      subText: "Amortização SAC, PRICE e Fixa",
    },
    {
      title: "Compras",
      description: "Mercado, feira e lista de compras",
      icon: ShoppingBag,
      color: "orange",
      href: "/painel/compras",
      customAction: () => router.push("/painel/compras/nova"),
      tooltipTitle: "Controle de Compras",
      tooltipDesc: "Registre compras de mercado. Controle estoque, compare preços e monte listas inteligentes.",
      subText: "Controle de estoque e preços",
    },
    {
      title: "Metas",
      description: "Objetivos e reservas financeiras",
      icon: Target,
      color: "amber",
      href: "/painel/metas",
      customAction: () => router.push("/painel/metas/nova"),
      tooltipTitle: "Metas Financeiras",
      tooltipDesc: "Defina objetivos como reserva de emergência. Acompanhe a projeção de atingimento.",
      subText: "Progresso e projeção",
    },
    {
      title: "Relatórios",
      description: "Analise seus dados financeiros",
      icon: FileText,
      color: "blue",
      href: "/painel/relatorios",
      customAction: () => router.push("/painel/relatorios"),
      tooltipTitle: "Relatórios e Análises",
      tooltipDesc: "Acesse relatórios mensais, por categoria e exporte dados em PDF/CSV.",
      actionLabel: "Gerar PDF/CSV",
    },
    {
      title: "Calculadora",
      description: "Simulador de Juros e Amortização",
      icon: Calculator,
      color: "indigo",
      href: "/painel/ferramentas/calculadora",
      badge: "Enterprise",
      tooltipTitle: "Calculadora Financeira",
      tooltipDesc: "Simule juros compostos e visualize tabelas de amortização SAC, PRICE e Fixa.",
    },

    {
      title: "Assinaturas",
      description: "Controle gastos recorrentes",
      icon: Zap,
      color: "cyan",
      href: "/painel/assinaturas",
      customAction: () => router.push("/painel/assinaturas/nova"),
      tooltipTitle: "Gerenciador de Assinaturas",
      tooltipDesc: "Acompanhe suas assinaturas recorrentes com alertas de renovação mensais.",
    },
    {
      title: "Patrimônio",
      description: "Ativos - Passivos = Patrimônio",
      icon: WalletIcon,
      color: "emerald",
      href: "/painel/patrimonio",
      customAction: () => router.push("/painel/patrimonio/novo"),
      tooltipTitle: "Patrimônio Líquido",
      tooltipDesc: "Visualize seus ativos menos passivos com breakdown por tipo de conta.",
    },
    {
      title: "Orçamentos",
      description: "Defina limites mensais de gastos",
      icon: PiggyBank,
      color: "pink",
      href: "/painel/orcamentos",
      customAction: () => router.push("/painel/orcamentos"),
      tooltipTitle: "Orçamentos",
      tooltipDesc: "Defina limites mensais com alertas configuráveis e barra de progresso.",
    },
  ];

  const colorStyles: Record<string, { bg: string; text: string; border: string; glow: string; glowLine: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "bg-emerald-500", glowLine: "bg-emerald-500/50" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", glow: "bg-blue-500", glowLine: "bg-blue-500/50" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", glow: "bg-cyan-500", glowLine: "bg-cyan-500/50" },
    red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", glow: "bg-red-500", glowLine: "bg-red-500/50" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", glow: "bg-orange-500", glowLine: "bg-orange-500/50" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "bg-amber-500", glowLine: "bg-amber-500/50" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", glow: "bg-indigo-500", glowLine: "bg-indigo-500/50" },
    slate: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/20", glow: "bg-slate-500", glowLine: "bg-slate-500/50" },
    pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20", glow: "bg-pink-500", glowLine: "bg-pink-500/50" },
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {actions.map((action, i) => {
          const style = colorStyles[action.color] || colorStyles.emerald;
          const IconComp = action.icon;
          
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative"
                >
                   <Link
                      href={action.href}
                      data-tour={
                        action.title === "Compras" ? "menu-compras" :
                        action.title === "Metas" ? "menu-metas" :
                        action.title === "Relatórios" ? "menu-relatorios" : undefined
                      }
                      className={`block p-6 rounded-2xl bg-slate-900/40 backdrop-blur-xl border ${style.border} transition-all duration-500 hover:border-white/10 overflow-hidden relative`}
                   >
                      {/* 1. Shimmer Effect (Holograma) */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                        style={{ skewX: -20 }}
                      />

                      {/* 2. Brilho de Fundo Dinâmico */}
                      <div className={`absolute -right-8 -top-8 w-32 h-32 blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none ${style.glow}`} />

                      {/* Badge "Enterprise" ou Outros */}
                      {action.badge && (
                        <div className={`absolute top-4 right-4 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded-full bg-slate-950/80 border ${style.border} ${style.text} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
                          {action.badge}
                        </div>
                      )}

                      {/* Botão de Atalho Rápido (+) */}
                      {action.customAction && !action.badge && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            action.customAction!();
                          }}
                          className={`absolute top-4 right-4 p-2 rounded-lg bg-slate-950/40 border border-white/5 text-slate-500 hover:text-white hover:border-white/20 transition-all z-10 shadow-lg`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}

                      {/* Cabeçalho do Card (Ícone Neural + Título) */}
                      <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className={`p-3 rounded-2xl bg-slate-950/60 border border-white/5 ${style.text}`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                          {action.title}
                        </h3>
                      </div>

                      {/* Descrição */}
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2 font-medium italic relative z-10">
                        {action.description}
                      </p>

                      {/* Rodapé do Card (Link HUD + Subtext) */}
                      <div className="flex items-center justify-between relative z-10">
                         <div className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest ${style.text} group-hover:translate-x-1 transition-transform`}>
                            {action.actionLabel || "Acessar"}
                            <ArrowUpRight className="w-3.5 h-3.5" />
                         </div>

                         {action.subText && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/50 border border-white/5">
                               <IconComp className={`w-3 h-3 ${style.text} opacity-50`} />
                               <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                                  {action.subText}
                               </span>
                            </div>
                         )}
                      </div>

                      {/* Detalhe de Borda HUD (Linha Neural) */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800/30 overflow-hidden">
                         <motion.div 
                           className={`h-full ${style.glowLine}`}
                           initial={{ x: "-100%" }}
                           whileHover={{ x: "0%" }}
                           transition={{ duration: 0.6 }}
                         />
                      </div>
                   </Link>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-950/95 border-slate-700 text-white shadow-2xl backdrop-blur-md max-w-xs p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-slate-900 border ${style.border}`}>
                    <Info className={`w-4 h-4 ${style.text}`} />
                  </div>
                  <div>
                    <p className={`font-black text-xs uppercase tracking-widest ${style.text} mb-1.5`}>
                      {action.tooltipTitle}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      {action.tooltipDesc}
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
