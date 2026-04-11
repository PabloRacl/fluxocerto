"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { RefreshCw } from "lucide-react";
import { api } from "@/biblioteca/http-client";
import { CarregamentoNeural } from "@/app/painel/_componentes/CarregamentoNeural";
import { motion, Variants } from "framer-motion";

// Componentes Desacoplados (UI limpa)
import { CabecalhoPainel } from "@/app/painel/_componentes/CabecalhoPainel";
import { CartoesResumo } from "@/app/painel/_componentes/CartoesResumo";
import { AcoesRapidas } from "@/app/painel/_componentes/AcoesRapidas";

// Gráficos e Painéis Especializados
import { GraficoEvolucaoSaldo } from "@/app/painel/_componentes/GraficoEvolucaoSaldo";
import { GraficoDespesasPorCategoria } from "@/app/painel/_componentes/GraficoDespesasPorCategoria";
import { GraficoProjecaoSaldo } from "@/app/painel/_componentes/GraficoProjecaoSaldo";
import { PainelInsights } from "@/app/painel/_componentes/PainelInsights";
import { GamificacaoFlutuante } from "@/app/painel/_componentes/GamificacaoFlutuante";
import { NotificacaoMascote } from "@/app/painel/_componentes/NotificacaoMascote";
import { MascoteAssistente } from "@/app/painel/_componentes/MascoteAssistente";

// variantes de animação (p9 - efeito quebra-cabeça)
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
    return <CarregamentoNeural message="Sincronizando Insights Neurais..." variant="full" />;
  }

  if (status === "unauthenticated") {
    router.push("/entrar");
    return null;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 overflow-hidden relative">
      
      {/* Sistema Global de Notificação de Conquistas (Sapo Financeiro) */}
      <NotificacaoMascote data={gamificacaoData} />

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

      <CabecalhoPainel user={data?.user} onSignOut={handleSignOut} />

      <motion.main 
        className="relative z-10 px-4 py-6 sm:p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          
          <motion.div variants={itemVariants}>
            <CartoesResumo summary={summary} loading={loading} userLevel={userLevel} />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
            <motion.div variants={itemVariants} className="h-full">
              <GraficoEvolucaoSaldo userId={data?.user?.email || ""} />
            </motion.div>
            <motion.div variants={itemVariants} className="h-full">
              <GraficoDespesasPorCategoria userId={data?.user?.email || ""} />
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="max-w-7xl mx-auto mb-8 text-center">
            <GraficoProjecaoSaldo userId={data?.user?.email || ""} />
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8">
            <PainelInsights userId={data?.user?.email || ""} userLevel={userLevel} />
          </motion.div>

          {/* Widget Flutuante de Gamificação (P7) */}
          <GamificacaoFlutuante />

          {/* Atalhos Rápidos Renderizados Modularmente */}
          <AcoesRapidas onNewTransaction={() => router.push("/painel/transacoes?drawer=open")} />
          
          {/* Assistente Mascot Neural (Mestre Sábio) */}
          <MascoteAssistente 
            userLevel={userLevel} 
            healthScore={summary.healthScore}
            balance={summary.totalBalance}
          />
        </div>
      </motion.main>
    </div>
  );
}
