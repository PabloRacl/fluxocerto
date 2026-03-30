"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Plus, 
  DollarSign, 
  Trophy, 
  Zap, 
  RefreshCw,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Activity
} from "lucide-react";
import { NeuralMascot } from "@/app/painel/_componentes/NeuralMascot";
import { motion, AnimatePresence } from "framer-motion";

interface Resumo {
  totalMetas: number;
  totalExcluidas: number;
  totalConcluidas: number;
  totalAlvo: number;
  totalAtual: number;
  progressoGeral: number;
}

interface MetaType {
  id: string;
  nome: string;
  descricao: string | null;
  valorAlvo: number;
  montanteAtual: number;
  prazo: string | null;
  icone: string | null;
  cor: string;
  concluida: boolean;
  concluidaEm: string | null;
  excluida: boolean;
  criadoEm: string;
  progresso: number;
  mediaMensal: number;
  mesesParaAtingir: number | null;
  categoria: { id: string; name: string; color: string } | null;
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v / 100);
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-xl ${className}`} />
  );
}

export default function MetasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metas, setMetas] = useState<MetaType[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDepositoModal, setShowDepositoModal] = useState(false);
  const [selectedMetaForDeposito, setSelectedMetaForDeposito] = useState<MetaType | null>(null);
  const [confettiMeta, setConfettiMeta] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<number>(1);

  const fetchUserLevel = useCallback(async () => {
    try {
      const res = await fetch("/api/gamificacao/resumo", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUserLevel(data.level || 1);
      }
    } catch {
      console.error("Erro ao carregar nível do usuário");
    }
  }, []);

  const fetchMetas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/metas?showDeleted=${showDeleted}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMetas(data.metas || []);
      setResumo(data.resumo || null);
      setError("");
    } catch {
      setError("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }
    if (status === "authenticated") {
      fetchMetas();
      fetchUserLevel();
    }
  }, [status, router, fetchMetas, fetchUserLevel]);

  const handleDeposito = (meta: MetaType) => {
    setSelectedMetaForDeposito(meta);
    setShowDepositoModal(true);
  };

  const handleConfirmDeposito = async (valor: number) => {
    if (!selectedMetaForDeposito || valor <= 0) return;
    try {
      const res = await fetch(`/api/metas/${selectedMetaForDeposito.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deposito: Math.round(valor * 100) }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.atingiu) {
          setConfettiMeta(selectedMetaForDeposito.id);
          setTimeout(() => setConfettiMeta(null), 4000);
        }
        setShowDepositoModal(false);
        setSelectedMetaForDeposito(null);
        fetchMetas();
      } else alert(data.error || "Erro");
    } catch {
      alert("Erro");
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Enviar meta para lixeira?")) return;
    try {
      const res = await fetch(`/api/metas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchMetas();
      else alert("Erro");
    } catch {
      alert("Erro");
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm("Restaurar esta meta?")) return;
    try {
      const res = await fetch(`/api/metas/${id}/restaurar`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) fetchMetas();
      else alert("Erro ao restaurar");
    } catch {
      alert("Erro");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (
      !confirm("⚠️ Excluir permanentemente? Esta ação não pode ser desfeita.")
    )
      return;
    try {
      const res = await fetch(`/api/metas/${id}/exclusao-permanente`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchMetas();
      else {
        const d = await res.json();
        alert(d.error || "Erro ao excluir");
      }
    } catch {
      alert("Erro");
    }
  };

  if (status === "loading") {
    return <NeuralLoading message="Calculando Projeção de Metas..." variant="full" />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen relative bg-slate-950 overflow-hidden">
        {/* Glow Orbs Neural HUD */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <PageHeader
            title="Metas de Patrimônio"
            description="Transforme sonhos em realidade com o poder dos juros compostos"
            breadcrumbs={[{ label: "Metas e Objetivos" }]}
          >
            <div className="flex items-center gap-2 mr-2">
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setShowDeleted(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!showDeleted ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <Target className="w-3 h-3" />
                  Ativas
                  {resumo && resumo.totalMetas > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${!showDeleted ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                      {resumo.totalMetas}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleted(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showDeleted ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <Archive className="w-3 h-3" />
                  Lixeira
                  {resumo && resumo.totalExcluidas > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${showDeleted ? "bg-amber-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                      {resumo.totalExcluidas}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={fetchMetas}
              className="p-2 text-slate-400 hover:text-emerald-400 transition-colors hidden sm:block"
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:block">Nova Meta</span>
            </button>
          </PageHeader>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header Dashboard & Mascot Side-by-Side */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Lado Esquerdo: Resumo Geral */}
            <div className="flex-1">
              {resumo && !showDeleted ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                  {/* Card: Metas Ativas */}
                  <div className="p-5 bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                    {/* Laser Scan Animation */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      style={{ skewX: -20 }}
                    />
                    
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                        <Target className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Módulos Ativos</span>
                    </div>
                    <p className="text-3xl font-black text-white ml-1 relative z-10" style={{ textShadow: "0 0 20px rgba(16,185,129,0.2)" }}>
                      {resumo.totalMetas}
                    </p>

                    {/* Glow Line Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-800/30 overflow-hidden">
                       <motion.div 
                         className="h-full bg-emerald-500/50"
                         initial={{ x: "-100%" }}
                         whileHover={{ x: "0%" }}
                         transition={{ duration: 0.6 }}
                       />
                    </div>
                  </div>

                  {/* Card: Concluídas */}
                  <div className="p-5 bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                     {/* Laser Scan Animation */}
                     <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      style={{ skewX: -20 }}
                    />

                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all">
                        <Trophy className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Sync Completa</span>
                    </div>
                    <p className="text-3xl font-black text-amber-400 ml-1 relative z-10" style={{ textShadow: "0 0 20px rgba(245,158,11,0.3)" }}>
                      {resumo.totalConcluidas}
                    </p>

                    {/* Glow Line Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-800/30 overflow-hidden">
                       <motion.div 
                         className="h-full bg-amber-500/50"
                         initial={{ x: "-100%" }}
                         whileHover={{ x: "0%" }}
                         transition={{ duration: 0.6 }}
                       />
                    </div>
                  </div>

                  {/* Card: Progresso Geral */}
                  <div className="p-5 bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                    {/* Laser Scan Animation */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      style={{ skewX: -20 }}
                    />
                    
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                        <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Sincronização</span>
                    </div>
                    <p className="text-3xl font-black text-blue-400 ml-1 mb-3 relative z-10" style={{ textShadow: "0 0 20px rgba(59,130,246,0.3)" }}>
                      {resumo.progressoGeral}%
                    </p>
                    <div className="w-full h-1.5 mt-2 bg-slate-800/80 rounded-full overflow-hidden relative z-10 border border-white/5 p-[1px]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${resumo.progressoGeral}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                      />
                    </div>

                    {/* Glow Line Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-800/30 overflow-hidden">
                       <motion.div 
                         className="h-full bg-blue-500/50"
                         initial={{ x: "-100%" }}
                         whileHover={{ x: "0%" }}
                         transition={{ duration: 0.6 }}
                       />
                    </div>
                  </div>

                  {/* Card: Acumulado Global */}
                  <div className="p-5 bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                    {/* Laser Scan Animation */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      style={{ skewX: -20 }}
                    />

                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">
                        <DollarSign className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Patrimônio Alvo</span>
                    </div>
                    <p className="text-2xl font-black text-white ml-1 relative z-10" style={{ textShadow: "0 0 20px rgba(255,255,255,0.2)" }}>
                      {formatCurrency(resumo.totalAtual)}
                    </p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mt-1 relative z-10">
                      Total: <span className="text-white/80">{formatCurrency(resumo.totalAlvo)}</span>
                    </p>

                    {/* Glow Line Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-800/30 overflow-hidden">
                       <motion.div 
                         className="h-full bg-purple-500/50"
                         initial={{ x: "-100%" }}
                         whileHover={{ x: "0%" }}
                         transition={{ duration: 0.6 }}
                       />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[160px] bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/5 flex items-center justify-center">
                  {showDeleted ? (
                    <p className="text-slate-500 text-sm">Visualizando Lixeira</p>
                  ) : (
                    <p className="text-slate-500 text-sm">Crie sua primeira meta para ver o resumo global.</p>
                  )}
                </div>
              )}
            </div>

            {/* Lado Direito: Neural Mascot Panel */}
            <div className="w-full lg:w-[280px] shrink-0 bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 pointer-events-none" />
              <NeuralMascot 
                size="lg" 
                level={userLevel} 
                className="hover:scale-105 transition-transform duration-500 relative z-10 drop-shadow-2xl" 
              />
              <div className="mt-4 text-center relative z-10">
                <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest mb-1 block">Mentor Focado</span>
                <p className="text-xs text-slate-300 italic">"Cada depósito é um tijolo na sua fortaleza financeira. Força, Gafanhoto!"</p>
              </div>
            </div>
          </div>

          {loading && (
            <NeuralLoading message="Sincronizando Metas..." variant="card" />
          )}

          {!loading && !error && metas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Target className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {showDeleted ? "Lixeira vazia" : "Nenhuma meta definida"}
              </h3>
              <p className="text-slate-400 text-center mb-4">
                {showDeleted
                  ? "Metas excluídas aparecerão aqui"
                  : "Defina metas financeiras para acompanhar seu progresso"}
              </p>
              {!showDeleted && (
                <button
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg"
                >
                  <Plus className="w-4 h-4" /> Nova Meta
                </button>
              )}
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Grid de Metas */}
          {!loading && !error && metas.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {metas.map((meta) => (
                <div
                  key={meta.id}
                  className={`relative p-6 bg-slate-950/40 backdrop-blur-2xl rounded-3xl border transition-all duration-500 overflow-hidden group ${
                    meta.concluida
                      ? "border-amber-500/30 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                      : "border-white/5"
                  }`}
                  onMouseEnter={(e) => {
                    if (!meta.concluida) {
                      e.currentTarget.style.boxShadow = `0 0 30px ${meta.cor}30`;
                      e.currentTarget.style.borderColor = `${meta.cor}50`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!meta.concluida) {
                      e.currentTarget.style.boxShadow = `none`;
                      e.currentTarget.style.borderColor = `rgba(255,255,255,0.05)`;
                    }
                  }}
                >
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${meta.cor}15, transparent 70%)` }} />
                  
                  {/* Laser Scan Animation Individual */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                    style={{ skewX: -20 }}
                  />

                  {/* Confetti Animation */}
                  {confettiMeta === meta.id && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl animate-bounce">🎉</div>
                      </div>
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 rounded-full animate-ping"
                          style={{
                            backgroundColor: [
                              "#10B981",
                              "#F59E0B",
                              "#3B82F6",
                              "#8B5CF6",
                              "#EF4444",
                            ][i % 5],
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 0.5}s`,
                            animationDuration: `${0.5 + Math.random() * 0.5}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-white/5"
                        style={{ backgroundColor: `${meta.cor}20`, color: meta.cor }}
                      >
                        {meta.icone || "🎯"}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                          {meta.nome}
                        </h3>
                        {meta.descricao && (
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic font-medium uppercase tracking-tighter">
                            {meta.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                    {meta.concluida && (
                      <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        Sync Completa
                      </div>
                    )}
                  </div>

                  {/* Valores */}
                  <div className="mb-4 relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <span>{formatCurrency(meta.montanteAtual)}</span>
                      <span>{formatCurrency(meta.valorAlvo)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900/80 rounded-full overflow-hidden p-[1.5px] border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${meta.progresso}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_currentColor]"
                        style={{
                          background: `linear-gradient(90deg, ${meta.cor}CC, ${meta.cor})`,
                          color: meta.cor
                        }}
                      />
                    </div>
                    <p
                      className="text-right text-[10px] font-black tracking-widest mt-1.5"
                      style={{ color: meta.cor }}
                    >
                      HP: {meta.progresso}%
                    </p>
                  </div>

                  {/* Projeção */}
                  {!meta.concluida && meta.mesesParaAtingir !== null && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-4 p-2.5 bg-slate-950/60 rounded-xl border border-white/5 italic font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Sincronização estimada em <span className="text-white font-black">{meta.mesesParaAtingir} ciclos</span>
                      </span>
                    </div>
                  )}

                  {/* Prazo */}
                  {meta.prazo && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">
                      <Calendar className="w-3 h-3 text-blue-400" />
                      Limite: {new Date(meta.prazo).toLocaleDateString("pt-BR")}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                    {showDeleted ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestore(meta.id)}
                          className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition-all"
                        >
                          <ArchiveRestore className="w-3.5 h-3.5" />
                          Restaurar
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(meta.id)}
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {!meta.concluida && (
                          <button
                            onClick={() => handleDeposito(meta)}
                            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:translate-x-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Injetar Fluxo
                          </button>
                        )}
                        <button
                          onClick={() => handleArchive(meta.id)}
                          className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors border border-transparent hover:border-amber-500/20"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Glow Line Bottom Individual */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-800/30 overflow-hidden">
                       <motion.div 
                         className="h-full"
                         style={{ backgroundColor: meta.cor }}
                         initial={{ x: "-100%" }}
                         whileHover={{ x: "0%" }}
                         transition={{ duration: 0.6 }}
                       />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal Depósito */}
        {showDepositoModal && selectedMetaForDeposito && (
          <DepositoModal
            meta={selectedMetaForDeposito}
            onClose={() => {
              setShowDepositoModal(false);
              setSelectedMetaForDeposito(null);
            }}
            onConfirm={handleConfirmDeposito}
          />
        )}

        {/* Modal Nova Meta */}
        {showNewModal && (
          <NovaMetaModal
            onClose={() => setShowNewModal(false)}
            onSuccess={() => {
              setShowNewModal(false);
              fetchMetas();
            }}
          />
        )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================
// MODAL DE DEPÓSITO (INJETAR FLUXO)
// ============================================
function DepositoModal({
  meta,
  onClose,
  onConfirm,
}: {
  meta: MetaType;
  onClose: () => void;
  onConfirm: (valor: number) => void;
}) {
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(valor);
    if (v > 0) {
      setLoading(true);
      onConfirm(v);
    }
  };

  return (
    <AnimatedModal
      isOpen={true}
      onClose={onClose}
      title={`Injetar Fluxo: ${meta.nome}`}
      subtitle="Aproxime-se do seu objetivo estratégico"
      icon={<DollarSign className="w-6 h-6 text-white" />}
      theme="emerald"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2 font-black uppercase tracking-widest">
            Montante do Aporte (R$)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            <input
              type="number"
              step="0.01"
              autoFocus
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-emerald-500/30 rounded-2xl text-white text-xl font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 mb-4">
          <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
            <span>Novo Saldo Estimado</span>
          </div>
          <div className="text-lg font-black text-white">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((meta.montanteAtual + (parseFloat(valor) || 0) * 100) / 100)}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-700 transition-all border border-slate-700"
          >
            Abortar
          </button>
          <button
            type="submit"
            disabled={loading || !valor || parseFloat(valor) <= 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-400 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:from-emerald-500 hover:to-emerald-300 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? "Sincronizando..." : "Confirmar Injeção"}
          </button>
        </div>
      </form>
    </AnimatedModal>
  );
}

// ============================================
// MODAL NOVA META
// ============================================
function NovaMetaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    valorAlvo: "",
    montanteAtual: "0",
    prazo: "",
    icone: "🎯",
    cor: "#10B981",
  });

  const icones = [
    "🎯",
    "🏠",
    "🚗",
    "✈️",
    "📱",
    "💻",
    "🎓",
    "💍",
    "🏥",
    "💰",
    "📈",
    "🛡️",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          valorAlvo: Math.round(parseFloat(form.valorAlvo) * 100),
          montanteAtual: Math.round(parseFloat(form.montanteAtual) * 100),
          prazo: form.prazo || null,
        }),
      });
      if (res.ok) onSuccess();
      else {
        const d = await res.json();
        alert(d.error || "Erro");
      }
    } catch {
      alert("Erro ao criar meta");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm";

  return (
    <AnimatedModal
      isOpen={true}
      onClose={onClose}
      title="🎯 Nova Meta Financeira"
      subtitle="Defina um objetivo e acompanhe seu progresso"
      icon={<Target className="w-6 h-6 text-white" />}
      theme="emerald"
      maxWidth="lg"
    >
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Nome da Meta *
            </label>
            <input
              className={inputClass}
              required
              placeholder="Ex: Reserva de Emergência"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Descrição
            </label>
            <input
              className={inputClass}
              placeholder="Ex: 6 meses de despesas fixas"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Valor Alvo (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                required
                placeholder="10000.00"
                value={form.valorAlvo}
                onChange={(e) =>
                  setForm({ ...form, valorAlvo: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Já Acumulado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.montanteAtual}
                onChange={(e) =>
                  setForm({ ...form, montanteAtual: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Prazo</label>
            <input
              type="date"
              className={inputClass}
              value={form.prazo}
              onChange={(e) => setForm({ ...form, prazo: e.target.value })}
            />
          </div>

          {/* Ícone */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {icones.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm({ ...form, icone: ic })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                    form.icone === ic
                      ? "bg-emerald-500/20 border-2 border-emerald-500 scale-110"
                      : "bg-slate-800 border border-slate-700 hover:border-slate-600"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Cor</label>
            <div className="flex gap-2">
              {[
                "#10B981",
                "#3B82F6",
                "#8B5CF6",
                "#F59E0B",
                "#EF4444",
                "#EC4899",
                "#06B6D4",
              ].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, cor: c })}
                  className={`w-8 h-8 rounded-full transition-all ${form.cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Criar Meta"}
            </button>
          </div>
        </form>
    </AnimatedModal>
  );
}
