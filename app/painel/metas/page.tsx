"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
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
} from "lucide-react";

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
  const [confettiMeta, setConfettiMeta] = useState<string | null>(null);

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
    if (status === "authenticated") fetchMetas();
  }, [status, router, fetchMetas]);

  const handleDeposito = async (id: string, nome: string) => {
    const valor = prompt(`Quanto deseja depositar na meta "${nome}"? (R$)`);
    if (!valor || isNaN(parseFloat(valor))) return;
    try {
      const res = await fetch(`/api/metas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deposito: Math.round(parseFloat(valor) * 100) }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.atingiu) {
          setConfettiMeta(id);
          setTimeout(() => setConfettiMeta(null), 4000);
        }
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <PageHeader
          title="Metas Financeiras"
          subtitle="Defina objetivos e acompanhe seu progresso"
          onRefresh={fetchMetas}
          onNew={() => setShowNewModal(true)}
          newButtonText="Nova Meta"
          showFilters
          filters={
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setShowDeleted(false)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${!showDeleted ? "bg-emerald-600 text-white" : "text-slate-400"}`}
              >
                <Target className="w-3 h-3" />
                Ativas
              </button>
              <button
                onClick={() => setShowDeleted(true)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${showDeleted ? "bg-red-600 text-white" : "text-slate-400"}`}
              >
                <Archive className="w-3 h-3" />
                Lixeira
              </button>
            </div>
          }
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Resumo Geral */}
          {resumo && !showDeleted && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900/50 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">Metas Ativas</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {resumo.totalMetas}
                </p>
              </div>
              <div className="p-5 bg-slate-900/50 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-sm text-slate-400">Concluídas</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {resumo.totalConcluidas}
                </p>
              </div>
              <div className="p-5 bg-slate-900/50 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Progresso Geral
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {resumo.progressoGeral}%
                </p>
                <div className="w-full h-2 mt-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                    style={{ width: `${resumo.progressoGeral}%` }}
                  />
                </div>
              </div>
              <div className="p-5 bg-slate-900/50 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Total Acumulado
                  </span>
                </div>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(resumo.totalAtual)}{" "}
                  <span className="text-xs text-slate-500">
                    de {formatCurrency(resumo.totalAlvo)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </div>
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
                  className={`relative p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border transition-all hover:shadow-lg ${
                    meta.concluida
                      ? "border-amber-500/40 hover:border-amber-500/60"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
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
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${meta.cor}20` }}
                      >
                        {meta.icone || "🎯"}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {meta.nome}
                        </h3>
                        {meta.descricao && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {meta.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                    {meta.concluida && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        🏆 Concluída
                      </span>
                    )}
                  </div>

                  {/* Valores */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{formatCurrency(meta.montanteAtual)}</span>
                      <span>{formatCurrency(meta.valorAlvo)}</span>
                    </div>
                    <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${meta.progresso}%`,
                          background: `linear-gradient(90deg, ${meta.cor}CC, ${meta.cor})`,
                        }}
                      />
                    </div>
                    <p
                      className="text-right text-xs font-medium mt-1"
                      style={{ color: meta.cor }}
                    >
                      {meta.progresso}%
                    </p>
                  </div>

                  {/* Projeção */}
                  {!meta.concluida && meta.mesesParaAtingir !== null && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 p-2 bg-slate-800/50 rounded-lg">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>
                        No ritmo atual ({formatCurrency(meta.mediaMensal)}/mês),
                        atinge em{" "}
                        <span className="text-white font-medium">
                          {meta.mesesParaAtingir}{" "}
                          {meta.mesesParaAtingir === 1 ? "mês" : "meses"}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Prazo */}
                  {meta.prazo && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                      <Calendar className="w-3 h-3" />
                      Prazo: {new Date(meta.prazo).toLocaleDateString("pt-BR")}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    {showDeleted ? (
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleRestore(meta.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                            >
                              <ArchiveRestore className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Restaurar</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handlePermanentDelete(meta.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-red-400">Excluir Permanente</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ) : (
                      <>
                        {!meta.concluida && (
                          <button
                            onClick={() => handleDeposito(meta.id, meta.nome)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all"
                          >
                            <DollarSign className="w-3 h-3" />
                            Depositar
                          </button>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleArchive(meta.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enviar para Lixeira</p>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

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
    </TooltipProvider>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">
            🎯 Nova Meta Financeira
          </h2>
          <p className="text-sm text-slate-400">
            Defina um objetivo e acompanhe seu progresso
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
      </div>
    </div>
  );
}
