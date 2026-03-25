"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";
import {
  Archive,
  ArchiveRestore,
  Trash2,
  Edit2,
  DollarSign,
  CreditCard,
  Calendar,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Wallet,
  Eye,
} from "lucide-react";

// ============================================
// TIPOS
// ============================================
interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  installmentValue: number;
  installmentTotal: number;
  installmentPaid: number;
  interestRate: number | null;
  amortizationType: string | null;
  allowsPrepayment: boolean;
  startDate: string;
  nextDueDate: string;
  endDate: string | null;
  status: "ACTIVE" | "PAID" | "CANCELLED";
  isPaidOff: boolean;
  creditor: string | null;
  isDeleted: boolean;
  account: { id: string; name: string; color: string; icon: string | null };
  category: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    type: string;
  };
}

interface Resumo {
  totalEmDividas: number;
  parcelasMensal: number;
  proximoVencimento: string | null;
  totalAtivas: number;
  totalQuitadas: number;
}

// ============================================
// HELPERS
// ============================================
function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function getProgressColor(percent: number): string {
  if (percent >= 80) return "from-emerald-500 to-emerald-400";
  if (percent >= 50) return "from-amber-500 to-amber-400";
  return "from-red-500 to-red-400";
}

// ============================================
// SKELETON
// ============================================
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-xl ${className}`} />
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function DividasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dividas, setDividas] = useState<Debt[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "ACTIVE" | "PAID" | "CANCELLED"
  >("ALL");
  const [showNewModal, setShowNewModal] = useState(false);

  // ============================================
  // FETCH
  // ============================================
  const fetchDividas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("showDeleted", showDeleted.toString());
      if (filterStatus !== "ALL") params.set("status", filterStatus);

      const res = await fetch(`/api/dividas?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao buscar dívidas");

      const data = await res.json();
      setDividas(data.dividas || []);
      setResumo(data.resumo || null);
      setError("");
    } catch (err) {
      setError("Não foi possível carregar as dívidas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showDeleted, filterStatus]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }
    if (status === "authenticated") {
      fetchDividas();
    }
  }, [status, router, fetchDividas]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleArchive = async (id: string) => {
    if (!confirm("Enviar esta dívida para a lixeira?")) return;
    try {
      const res = await fetch(`/api/dividas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchDividas();
      else alert("Erro ao arquivar dívida");
    } catch {
      alert("Erro ao arquivar");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/dividas/${id}/exclusao-permanente`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) fetchDividas();
      else alert("Erro ao restaurar");
    } catch {
      alert("Erro ao restaurar");
    }
  };

  const handleDeletePermanent = async (id: string) => {
    if (
      !confirm(
        "⚠️ ATENÇÃO: Exclusão PERMANENTE. Esta ação não pode ser desfeita!",
      )
    )
      return;
    try {
      const res = await fetch(`/api/dividas/${id}/exclusao-permanente`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchDividas();
      else alert("Erro ao excluir");
    } catch {
      alert("Erro ao excluir");
    }
  };

  const handlePayInstallment = async (id: string) => {
    if (!confirm("Registrar pagamento de 1 parcela?")) return;
    try {
      const res = await fetch(`/api/dividas/${id}/pagar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tipo: "PAGAR_PARCELA", quantidadeParcelas: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.quitada) alert("🎉 Parabéns! Dívida quitada!");
        fetchDividas();
      } else {
        alert(data.error || "Erro ao registrar pagamento");
      }
    } catch {
      alert("Erro ao pagar parcela");
    }
  };

  // ============================================
  // RENDER
  // ============================================
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
          title="Dívidas Parceladas"
          subtitle="Gerencie suas dívidas e financiamentos"
          onRefresh={fetchDividas}
          onNew={() => setShowNewModal(true)}
          newButtonText="Nova Dívida"
          showFilters
          filters={
            <div className="flex items-center gap-2">
              {/* Toggle Ativas/Lixeira */}
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => {
                    setShowDeleted(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${!showDeleted ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <CreditCard className="w-3 h-3" />
                  Ativas
                </button>
                <button
                  onClick={() => {
                    setShowDeleted(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${showDeleted ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <Archive className="w-3 h-3" />
                  Lixeira
                </button>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Todos</option>
                <option value="ACTIVE">🔴 Ativas</option>
                <option value="PAID">✅ Quitadas</option>
                <option value="CANCELLED">❌ Canceladas</option>
              </select>
            </div>
          }
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Cards de Resumo */}
          {resumo && !showDeleted && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border border-red-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Total em Dívidas
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(resumo.totalEmDividas)}
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-sm text-slate-400">Parcelas/Mês</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {formatCurrency(resumo.parcelasMensal)}
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Próximo Vencimento
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {resumo.proximoVencimento
                    ? formatDate(resumo.proximoVencimento)
                    : "—"}
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Dívidas Ativas / Quitadas
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  <span className="text-red-400">{resumo.totalAtivas}</span>
                  {" / "}
                  <span className="text-emerald-400">
                    {resumo.totalQuitadas}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          )}

          {/* Erro */}
          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchDividas}
                className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Vazio */}
          {!loading && !error && dividas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Wallet className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {showDeleted ? "Lixeira vazia" : "Nenhuma dívida cadastrada"}
              </h3>
              <p className="text-slate-400 text-center mb-4">
                {showDeleted
                  ? "Dívidas excluídas aparecerão aqui"
                  : "Registre suas dívidas para acompanhar o progresso de quitação"}
              </p>
              {!showDeleted && (
                <button
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Nova Dívida
                </button>
              )}
            </div>
          )}

          {/* Lista de Dívidas */}
          {!loading && !error && dividas.length > 0 && (
            <div className="space-y-4">
              {dividas.map((divida) => {
                const progresso = Math.round(
                  (divida.installmentPaid / divida.installmentTotal) * 100,
                );
                const restante =
                  divida.totalAmount -
                  divida.installmentValue * divida.installmentPaid;
                const diasAteVencimento = Math.ceil(
                  (new Date(divida.nextDueDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                );
                const vencimentoProximo =
                  diasAteVencimento <= 5 && diasAteVencimento >= 0;
                const vencido = diasAteVencimento < 0;

                return (
                  <div
                    key={divida.id}
                    className={`p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border transition-all hover:shadow-lg ${
                      divida.isPaidOff
                        ? "border-emerald-500/30 hover:border-emerald-500/60"
                        : vencido
                          ? "border-red-500/40 hover:border-red-500/60"
                          : vencimentoProximo
                            ? "border-amber-500/30 hover:border-amber-500/60"
                            : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Info Principal */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-white">
                                {divida.name}
                              </h3>
                              {divida.isPaidOff && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  ✅ Quitada
                                </span>
                              )}
                              {vencido && !divida.isPaidOff && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Vencida
                                </span>
                              )}
                              {vencimentoProximo &&
                                !divida.isPaidOff &&
                                !vencido && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    ⏳ Vence em {diasAteVencimento}d
                                  </span>
                                )}
                            </div>
                            {divida.creditor && (
                              <p className="text-sm text-slate-500 mt-0.5">
                                Credor: {divida.creditor}
                              </p>
                            )}
                          </div>

                          {/* Valor da Parcela */}
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Parcela</p>
                            <p className="text-lg font-bold text-white">
                              {formatCurrency(divida.installmentValue)}
                            </p>
                          </div>
                        </div>

                        {/* Barra de Progresso */}
                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>
                              {divida.installmentPaid} de{" "}
                              {divida.installmentTotal} parcelas
                            </span>
                            <span>{progresso}%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(progresso)} transition-all duration-500`}
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                        </div>

                        {/* Info Secundária */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: divida.category.color }}
                            />
                            {divida.category.name}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: divida.account.color }}
                            />
                            {divida.account.name}
                          </div>
                          {divida.amortizationType && (
                            <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                              {divida.amortizationType}
                            </span>
                          )}
                          {divida.interestRate && (
                            <span className="text-amber-400">
                              {Number(divida.interestRate)}% a.m.
                            </span>
                          )}
                          <span>
                            Vencimento: {formatDate(divida.nextDueDate)}
                          </span>
                          <span className="text-red-400 font-medium">
                            Restante: {formatCurrency(restante)}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 lg:flex-col">
                        {showDeleted ? (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleRestore(divida.id)}
                                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                >
                                  <ArchiveRestore className="w-5 h-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Restaurar</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() =>
                                    handleDeletePermanent(divida.id)
                                  }
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-red-400">
                                  Excluir Permanentemente
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            {/* Pagar Parcela */}
                            {!divida.isPaidOff && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() =>
                                      handlePayInstallment(divida.id)
                                    }
                                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                  >
                                    <DollarSign className="w-5 h-5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Pagar Parcela</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {/* Ver Detalhes */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/painel/dividas/${divida.id}`}
                                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                >
                                  <Eye className="w-5 h-5" />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver Detalhes</p>
                              </TooltipContent>
                            </Tooltip>
                            {/* Arquivar */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleArchive(divida.id)}
                                  className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                >
                                  <Archive className="w-5 h-5" />
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
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Modal Nova Dívida */}
        {showNewModal && (
          <NovaDividaModal
            onClose={() => setShowNewModal(false)}
            onSuccess={() => {
              setShowNewModal(false);
              fetchDividas();
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// ============================================
// MODAL DE NOVA DÍVIDA
// ============================================
function NovaDividaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    totalAmount: "",
    installmentValue: "",
    installmentTotal: "",
    installmentPaid: "0",
    interestRate: "",
    amortizationType: "",
    startDate: new Date().toISOString().split("T")[0],
    nextDueDate: "",
    accountId: "",
    categoryId: "",
    creditor: "",
    allowsPrepayment: true,
  });

  useEffect(() => {
    fetch("/api/contas", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAccounts(Array.isArray(d) ? d : d.accounts || []));
    fetch("/api/categorias?type=EXPENSE", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/dividas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          totalAmount: Math.round(parseFloat(form.totalAmount) * 100),
          installmentValue: Math.round(parseFloat(form.installmentValue) * 100),
          installmentTotal: parseInt(form.installmentTotal),
          installmentPaid: parseInt(form.installmentPaid),
          interestRate: form.interestRate
            ? parseFloat(form.interestRate)
            : null,
          amortizationType: form.amortizationType || null,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar dívida");
      }
    } catch {
      alert("Erro ao criar dívida");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Nova Dívida</h2>
          <p className="text-sm text-slate-400">
            Registre um financiamento, empréstimo ou parcelamento
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome + Credor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Nome da Dívida *
              </label>
              <input
                className={inputClass}
                placeholder="Ex: Financiamento Carro"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Credor
              </label>
              <input
                className={inputClass}
                placeholder="Ex: Banco Itaú"
                value={form.creditor}
                onChange={(e) => setForm({ ...form, creditor: e.target.value })}
              />
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                placeholder="50000.00"
                required
                value={form.totalAmount}
                onChange={(e) =>
                  setForm({ ...form, totalAmount: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Valor da Parcela (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                placeholder="1500.00"
                required
                value={form.installmentValue}
                onChange={(e) =>
                  setForm({ ...form, installmentValue: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Nº Total de Parcelas *
              </label>
              <input
                type="number"
                className={inputClass}
                placeholder="48"
                required
                value={form.installmentTotal}
                onChange={(e) =>
                  setForm({ ...form, installmentTotal: e.target.value })
                }
              />
            </div>
          </div>

          {/* Parcelas pagas + Juros + Amortização */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Parcelas Já Pagas
              </label>
              <input
                type="number"
                className={inputClass}
                value={form.installmentPaid}
                onChange={(e) =>
                  setForm({ ...form, installmentPaid: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Taxa de Juros (% a.m.)
              </label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                placeholder="1.5"
                value={form.interestRate}
                onChange={(e) =>
                  setForm({ ...form, interestRate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Tipo de Amortização
              </label>
              <select
                className={inputClass}
                value={form.amortizationType}
                onChange={(e) =>
                  setForm({ ...form, amortizationType: e.target.value })
                }
              >
                <option value="">Selecione</option>
                <option value="SAC">SAC (Parcelas Decrescentes)</option>
                <option value="PRICE">PRICE (Parcelas Fixas)</option>
                <option value="FIXED">Fixa</option>
              </select>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Data de Início *
              </label>
              <input
                type="date"
                className={inputClass}
                required
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Próximo Vencimento *
              </label>
              <input
                type="date"
                className={inputClass}
                required
                value={form.nextDueDate}
                onChange={(e) =>
                  setForm({ ...form, nextDueDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Conta + Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Conta *
              </label>
              <select
                className={inputClass}
                required
                value={form.accountId}
                onChange={(e) =>
                  setForm({ ...form, accountId: e.target.value })
                }
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Categoria *
              </label>
              <select
                className={inputClass}
                required
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Permite Antecipação */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowsPrepayment}
              onChange={(e) =>
                setForm({ ...form, allowsPrepayment: e.target.checked })
              }
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-300">
              Permite antecipação de parcelas
            </span>
          </label>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "Salvando..." : "Criar Dívida"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
