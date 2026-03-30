"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { RefreshCw } from "lucide-react";
import { api } from "@/biblioteca/http-client";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { TrendingUp, PieChart, LineChart } from "lucide-react";

// Componentes Desacoplados (UI limpa)
import { DashboardHeader } from "@/app/painel/_componentes/DashboardHeader";
import { SummaryCards } from "@/app/painel/_componentes/SummaryCards";
import { QuickActions } from "@/app/painel/_componentes/QuickActions";

// Gráficos e Painéis Especializados
import { BalanceEvolutionChart } from "@/app/painel/_componentes/BalanceEvolutionChart";
import { ExpensesByCategoryChart } from "@/app/painel/_componentes/ExpensesByCategoryChart";
import { BalanceForecastChart } from "@/app/painel/_componentes/BalanceForecastChart";
import { InsightsPanel } from "@/app/painel/_componentes/InsightsPanel";
import { FloatingGamification } from "@/app/painel/_componentes/FloatingGamification";
import { MascotNotification } from "@/app/painel/_componentes/MascotNotification";
import { MascotAssistant } from "@/app/painel/_componentes/MascotAssistant";

// ============================================
// VARIANTES DE ANIMAÇÃO (P9 - EFEITO QUEBRA-CABEÇA)
// ============================================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20, scale: 0.98 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    }
  },
};

// Função nativa do SWR para fetching
const fetcher = async (url: string) => {
  return api.get<any>(url);
};

export default function DashboardPage() {
  const { status, data } = useSession();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"evolution" | "category" | "forecast">("evolution");

  // Hook SWR que carrega e revalida os dados mestres do Dashboard automaticamente
  const { data: summaryData, isLoading } = useSWR(
    status === "authenticated" ? "/api/painel/resumo" : null,
    fetcher
  );

  // Hook para Gamificação (Necessário para o monitor de conquistas do Mascote)
  const { data: gamificacaoData } = useSWR(
    status === "authenticated" ? "/api/painel/gamificacao" : null,
    fetcher
  );

  const summary = {
    totalBalance: summaryData?.totalBalance ?? 0,
    totalIncome: summaryData?.totalIncome ?? 0,
    totalExpense: summaryData?.totalExpense ?? 0,
    monthlyBalance: summaryData?.monthlyBalance ?? 0,
    healthScore: summaryData?.healthScore ?? 0,
    healthStatus: summaryData?.healthStatus ?? "Analizando...",
    totalAssets: summaryData?.totalAssets ?? 0,
    netWorth: summaryData?.netWorth ?? 0
  };

  const loading = isLoading || status === "loading";

  // Efeito elegante de Mouse Tracking no Background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePosition({ x: x * 30, y: y * 30 });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    router.push("/entrar");
    router.refresh();
  };

  const userLevel = gamificacaoData?.data?.nivel?.nivel || 1;

  if (status === "loading") {
    return <NeuralLoading message="Sincronizando Insights Neurais..." variant="full" />;
  }

  if (status === "unauthenticated") {
    router.push("/entrar");
    return null;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 overflow-hidden relative">
      
      {/* Sistema Global de Notificação de Conquistas (Sapo Financeiro) */}
      <MascotNotification data={gamificacaoData} />

      {/* Background Glow Dinâmico */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent 70%)",
            transform: `translate(calc(-50% + ${mousePosition.x}px), calc(-50% + ${mousePosition.y}px))`,
            transition: "transform 0.5s ease-out",
          }}
        />
      </div>

      <DashboardHeader user={data?.user} onSignOut={handleSignOut} />

      <motion.main 
        className="relative z-10 px-4 py-6 sm:p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          
          <motion.div variants={itemVariants}>
            <SummaryCards summary={summary} loading={loading} userLevel={userLevel} />
          </motion.div>

          {/* Atalhos Rápidos Renderizados Modularmente Moveram para cima */}
          <QuickActions onNewTransaction={() => router.push("/painel/transacoes?drawer=open")} />

          <motion.div variants={itemVariants} className="mb-8 mt-4">
            <InsightsPanel userId={data?.user?.email || ""} userLevel={userLevel} />
          </motion.div>

          {/* PAINEL UNIFICADO DE ANÁLISE (ABAS NEURAIS) */}
          <motion.div variants={itemVariants} className="max-w-7xl mx-auto mb-8 relative z-10">
            {/* Controle de Abas */}
            <div className="flex justify-center mb-6 relative z-20">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 sm:gap-2 shadow-2xl">
                <button
                  onClick={() => setActiveTab("evolution")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-xs font-black tracking-widest uppercase ${activeTab === 'evolution' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <TrendingUp className="w-4 h-4" /> <span className="hidden sm:inline">Evolução</span>
                </button>
                <button
                  onClick={() => setActiveTab("category")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-xs font-black tracking-widest uppercase ${activeTab === 'category' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <PieChart className="w-4 h-4" /> <span className="hidden sm:inline">Categorias</span>
                </button>
                <button
                  onClick={() => setActiveTab("forecast")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-xs font-black tracking-widest uppercase ${activeTab === 'forecast' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <LineChart className="w-4 h-4" /> <span className="hidden sm:inline">Previsão (IA)</span>
                </button>
              </div>
            </div>

            {/* Conteúdo da Aba - mantido montado para não perder dimensões do ResponsiveContainer */}
            <div className="w-full">
              <div className={activeTab === 'evolution' ? 'block' : 'hidden'}>
                <BalanceEvolutionChart userId={data?.user?.email || ""} />
              </div>
              <div className={activeTab === 'category' ? 'block' : 'hidden'}>
                <ExpensesByCategoryChart userId={data?.user?.email || ""} />
              </div>
              <div className={activeTab === 'forecast' ? 'block' : 'hidden'}>
                <BalanceForecastChart userId={data?.user?.email || ""} />
              </div>
            </div>
          </motion.div>

          {/* Widget Flutuante de Gamificação (P7) */}
          <FloatingGamification />
          
          {/* Assistente Mascot Neural (Mestre Sábio) */}
          <MascotAssistant 
            userLevel={userLevel} 
            healthScore={summary.healthScore}
            balance={summary.totalBalance}
          />
        </div>
      </motion.main>
    </div>
  );
}
