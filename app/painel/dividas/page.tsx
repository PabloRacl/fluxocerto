"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";
import { MascotAssistant } from "@/app/painel/_componentes/MascotAssistant";
import EditDebtModal from "./_componentes/EditDebtModal";
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
  RefreshCw,
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
  totalExcluidas: number;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

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

  const handleEdit = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowEditModal(true);
  };

  // ============================================
  // RENDER
  // ============================================
  if (status === "loading") {
    return <NeuralLoading message="Analisando Fluxo de Débitos..." variant="full" />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <PageHeader
          title="Dívidas e Financiamentos"
          description="Gerencie seus débitos com barra de progresso e amortização SAC/PRICE"
          breadcrumbs={[{ label: "Dívidas Parceladas" }]}
        >
          <div className="flex items-center gap-2 mr-2">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setShowDeleted(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!showDeleted ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <CreditCard className="w-3 h-3" />
                Ativas
                {resumo && resumo.totalAtivas > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${!showDeleted ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                    {resumo.totalAtivas}
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 hidden sm:block"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">🔴 Ativas</option>
              <option value="PAID">✅ Quitadas</option>
              <option value="CANCELLED">❌ Canceladas</option>
            </select>
          </div>
          <button
            onClick={fetchDividas}
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
            <span className="hidden sm:block">Nova Dívida</span>
          </button>
        </PageHeader>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Cards de Resumo — Neuro HUD */}
          {resumo && !showDeleted && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total em Dívidas", value: formatCurrency(resumo.totalEmDividas), color: "red", Icon: TrendingDown },
                { label: "Parcelas/Mês", value: formatCurrency(resumo.parcelasMensal), color: "amber", Icon: CreditCard },
                { label: "Próximo Vencimento", value: resumo.proximoVencimento ? formatDate(resumo.proximoVencimento) : "—", color: "blue", Icon: Calendar },
                { label: "Ativas / Quitadas", value: null, color: "emerald", Icon: CheckCircle2 },
              ].map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`group/card relative p-5 bg-slate-950/60 backdrop-blur-2xl rounded-2xl border border-${card.color}-500/20 hover:border-${card.color}-500/50 transition-all duration-500 overflow-hidden`}
                >
                  {/* Shimmer Holográfico */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000" style={{ transform: 'skewX(-20deg)' }} />
                  {/* Glow corner */}
                  <div className={`absolute -top-8 -right-8 w-24 h-24 bg-${card.color}-500/10 blur-3xl pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity`} />

                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className={`w-10 h-10 rounded-xl bg-${card.color}-500/10 border border-${card.color}-500/20 flex items-center justify-center`}>
                      <card.Icon className={`w-5 h-5 text-${card.color}-400`} />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">{card.label}</span>
                  </div>
                  <div className="relative z-10">
                    {card.value !== null ? (
                      <p className={`text-2xl font-black text-${card.color}-400`}>{card.value}</p>
                    ) : (
                      <p className="text-2xl font-black text-white">
                        <span className="text-red-400">{resumo.totalAtivas}</span>
                        {" / "}
                        <span className="text-emerald-400">{resumo.totalQuitadas}</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
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
                  <motion.div
                    key={divida.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className={`group/debt relative p-6 bg-slate-950/50 backdrop-blur-2xl rounded-2xl border transition-all duration-500 overflow-hidden ${
                      divida.isPaidOff
                        ? "border-emerald-500/30 hover:border-emerald-500/60"
                        : vencido
                          ? "border-red-500/40 hover:border-red-500/60"
                          : vencimentoProximo
                            ? "border-amber-500/30 hover:border-amber-500/60"
                            : "border-white/5 hover:border-white/15"
                    }`}
                  >
                    {/* HUD Shimmer */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover/debt:translate-x-full transition-transform duration-1000" style={{ transform: 'skewX(-20deg)' }} />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                            {/* Editar */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleEdit(divida)}
                                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar Dívida</p>
                              </TooltipContent>
                            </Tooltip>

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
                  </motion.div>
                );
              })}
            </div>
          )}
          {/* Assistente Neural — Mestre Sábio */}
          <MascotAssistant />
        </main>

        {showNewModal && (
          <NovaDividaModal
            onClose={() => setShowNewModal(false)}
            onSuccess={() => {
              setShowNewModal(false);
              fetchDividas();
            }}
          />
        )}

        {/* Modal Editar Dívida */}
        <EditDebtModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDebt(null);
            fetchDividas();
          }}
          debt={selectedDebt}
        />
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

  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const [showOtherAccount, setShowOtherAccount] = useState(false);
  const [customAccount, setCustomAccount] = useState("");

  useEffect(() => {
    fetch("/api/contas", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAccounts(Array.isArray(d) ? d : d.accounts || []));
    fetch("/api/categorias?type=EXPENSE", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []));
  }, []);

  const handleCategoryChange = (value: string) => {
    if (value === "OTHER") {
      setShowOtherCategory(true);
      setForm((prev) => ({ ...prev, categoryId: "" }));
    } else {
      setShowOtherCategory(false);
      setForm((prev) => ({ ...prev, categoryId: value }));
      setCustomCategory("");
    }
  };

  const handleAccountChange = (value: string) => {
    if (value === "OTHER_ACCOUNT") {
      setShowOtherAccount(true);
      setForm((prev) => ({ ...prev, accountId: "" }));
    } else {
      setShowOtherAccount(false);
      setForm((prev) => ({ ...prev, accountId: value }));
      setCustomAccount("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalCategoryId = form.categoryId;
      let finalAccountId = form.accountId;

      // Criar nova conta se necessário
      if (showOtherAccount && customAccount.trim()) {
        const accRes = await fetch("/api/contas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customAccount.trim(),
            type: "CHECKING",
            color: "#6366F1",
            balance: 0,
          }),
        });

        if (!accRes.ok) throw new Error("Erro ao criar a nova conta");
        const accData = await accRes.json();
        finalAccountId = accData.account?.id || accData.id;
      }

      // Se a categoria personalizada foi selecionada, devemos criá-la antes
      if (showOtherCategory && customCategory.trim()) {
        const catRes = await fetch("/api/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customCategory.trim(),
            type: "EXPENSE",
            color: "#EF4444",
            icon: "TrendingDown",
          }),
        });

        if (!catRes.ok) throw new Error("Erro ao criar a nova categoria");
        const catData = await catRes.json();
        finalCategoryId = catData.category?.id || catData.id;
      }

      const res = await fetch("/api/dividas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          categoryId: finalCategoryId,
          accountId: finalAccountId,
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
    } catch (err: any) {
      alert(err.message || "Erro ao criar dívida");
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
      title="Nova Dívida"
      subtitle="Registre um financiamento, empréstimo ou parcelamento"
      icon={<DollarSign className="w-6 h-6 text-white" />}
      theme="emerald"
      maxWidth="2xl"
    >
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
                value={showOtherAccount ? "OTHER_ACCOUNT" : form.accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
                <option value="OTHER_ACCOUNT">➕ Outra Conta...</option>
              </select>

              {/* Campo personalizado para "Outra Conta" */}
              {showOtherAccount && (
                <div className="mt-3 p-3 bg-slate-900 border border-slate-700 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <input
                    type="text"
                    value={customAccount}
                    onChange={(e) => setCustomAccount(e.target.value)}
                    placeholder="Nome da nova conta"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    autoFocus
                    required
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Categoria *
              </label>
              <select
                className={inputClass}
                required
                value={showOtherCategory ? "OTHER" : form.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="OTHER">➕ Outra...</option>
              </select>

              {/* Campo personalizado para "Outro" */}
              {showOtherCategory && (
                <div className="mt-3 p-3 bg-slate-900 border border-slate-700 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Nome da nova categoria"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    autoFocus
                    required
                  />
                </div>
              )}
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
    </AnimatedModal>
  );
}
