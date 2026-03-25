"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/componentes/ui/skeleton";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  ArrowUpRight,
  AlertTriangle,
  CreditCard,
  Calendar,
  ArrowLeft,
  Archive,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";
// ✅ IMPORT DO MODAL FUTURISTA
import NewAccountModal from "./_componentes/NewAccountModal";

// ============================================
// FORMATADOR DE MOEDA (BRL)
// ============================================
const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};

// ============================================
// MAPEAMENTO DE ÍCONES
// ============================================
const getIcon = (iconName: string | null) => {
  const icons: Record<string, JSX.Element> = {
    wallet: <Wallet className="w-6 h-6" />,
    "piggy-bank": <Wallet className="w-6 h-6" />,
    "credit-card": <Wallet className="w-6 h-6" />,
    banknote: <Wallet className="w-6 h-6" />,
    landmark: <Wallet className="w-6 h-6" />,
    coins: <Wallet className="w-6 h-6" />,
    "shopping-cart": <Wallet className="w-6 h-6" />,
    utensils: <Wallet className="w-6 h-6" />,
  };
  return icons[iconName || "wallet"] || <Wallet className="w-6 h-6" />;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function AccountsPage() {
  const { status, data } = useSession();
  const router = useRouter();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [hiddenBalances, setHiddenBalances] = useState<Record<string, boolean>>(
    {},
  );

  // ✅ ESTADO PARA CONTROLAR O MODAL
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);

  // ✅ ESTADO PARA DADOS DE FATURA DOS CARTÕES
  const [cartaoData, setCartaoData] = useState<Record<string, any>>({});

  // ============================================
  // BUSCAR CONTAS (CORRIGIDO)
  // ============================================
  const fetchAccounts = useCallback(async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/contas?includeArchived=${showArchived}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar contas");
      }

      const result = await response.json();

      // ✅ CORREÇÃO: API retorna array direto, não objeto { accounts: [...] }
      const accountsData = Array.isArray(result)
        ? result
        : result.accounts || [];

      console.log("📊 Contas carregadas:", accountsData.length);
      setAccounts(accountsData);
    } catch (err) {
      console.error("❌ Erro ao buscar contas:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [status, showArchived]);

  // ============================================
  // BUSCAR DADOS DE FATURA DOS CARTÕES
  // ============================================
  const fetchCartaoData = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/cartoes", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, any> = {};
        (data.cartoes || []).forEach((c: any) => {
          map[c.id] = c;
        });
        setCartaoData(map);
      }
    } catch {}
  }, [status]);

  // ============================================
  // EFFECT
  // ============================================
  useEffect(() => {
    if (status === "authenticated") {
      fetchAccounts();
      fetchCartaoData();
    }
  }, [status, fetchAccounts, fetchCartaoData]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleArchive = async (accountId: string) => {
    if (!confirm("Tem certeza que deseja arquivar esta conta?")) return;

    try {
      const response = await fetch(`/api/contas/${accountId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao arquivar conta");
      }

      fetchAccounts();
    } catch (err) {
      console.error("Erro ao arquivar:", err);
      alert("Erro ao arquivar conta");
    }
  };

  const handleDeletePermanent = async (accountId: string) => {
    if (
      !confirm(
        "⚠️ ATENÇÃO: Esta é uma EXCLUSÃO PERMANENTE.\nA conta será destruída para sempre e não poderá ser recuperada. Continuar?",
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/contas/${accountId}/exclusao-permanente`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir conta");
      }

      fetchAccounts();
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("Erro ao excluir conta permanentemente");
    }
  };

  const handleRestore = async (accountId: string) => {
    if (!confirm("Deseja restaurar esta conta arquivada?")) return;

    try {
      const response = await fetch(`/api/contas/${accountId}/restaurar`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao restaurar conta");
      }

      fetchAccounts();
    } catch (err) {
      console.error("Erro ao restaurar:", err);
      alert("Erro ao restaurar conta");
    }
  };

  const toggleBalanceVisibility = (accountId: string) => {
    setHiddenBalances((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando contas...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: NÃO AUTENTICADO
  // ============================================
  if (status === "unauthenticated") {
    router.push("/entrar");
    return null;
  }

  // ============================================
  // RENDER: PRINCIPAL
  // ============================================
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/painel")}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Voltar</span>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Minhas Contas
                  </h1>
                  <p className="text-sm text-slate-400">
                    Gerencie suas contas bancárias e cartões
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle: Ativas / Arquivadas */}
                <div className="flex items-center bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setShowArchived(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      !showArchived
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Wallet className="w-3 h-3" />
                    Ativas
                  </button>
                  <button
                    onClick={() => setShowArchived(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      showArchived
                        ? "bg-amber-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Archive className="w-3 h-3" />
                    Lixeira
                    {accounts.filter((a) => !a.isActive).length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-700 rounded-full">
                        {accounts.filter((a) => !a.isActive).length}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  onClick={fetchAccounts}
                  className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                {/* ✅ BOTÃO QUE ABRE O MODAL (substitui o Link) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowNewAccountModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:block">Nova Conta</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 border-slate-700 text-white shadow-xl">
                    <p>Cadastrar nova conta bancária</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mensagem de Info */}
          {showArchived && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Visualizando contas arquivadas
                </p>
                <p className="text-xs text-amber-300 mt-1">
                  Contas arquivadas não aparecem no dashboard. Você pode
                  restaurá-las.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-slate-400">Carregando contas...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={fetchAccounts}
                  className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && accounts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Wallet className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {showArchived
                  ? "Nenhuma conta arquivada"
                  : "Nenhuma conta cadastrada"}
              </h3>
              <p className="text-slate-400 text-center mb-4">
                {showArchived
                  ? "Contas arquivadas aparecerão aqui"
                  : "Comece adicionando sua primeira conta bancária"}
              </p>
              {/* ✅ BOTÃO NO EMPTY STATE TAMBÉM ABRE O MODAL */}
              {!showArchived && (
                <button
                  onClick={() => setShowNewAccountModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Nova Conta
                </button>
              )}
            </div>
          )}

          {/* Grid de Cards */}
          {!loading && !error && accounts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts
                .filter((account) =>
                  showArchived ? !account.isActive : account.isActive,
                )
                .map((account) => (
                  <Tooltip key={account.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`relative p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl ${
                          account.isActive
                            ? "border-slate-800 hover:border-emerald-500/50"
                            : "border-amber-500/30 bg-amber-500/5"
                        }`}
                        style={{
                          borderLeft: `4px solid ${account.color}`,
                        }}
                      >
                        {/* Badge de Arquivado */}
                        {!account.isActive && (
                          <div className="absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Arquivada
                          </div>
                        )}

                        {/* Header do Card */}
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                            style={{
                              backgroundColor: `${account.color}20`,
                              color: account.color,
                            }}
                          >
                            {getIcon(account.icon)}
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1">
                            {account.isActive ? (
                              <>
                                {/* Toggle Visibilidade do Saldo */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBalanceVisibility(account.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Editar */}
                                <Link
                                  href={`/painel/contas/${account.id}/editar`}
                                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Link>

                                {/* Arquivar */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchive(account.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Restaurar */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestore(account.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                {/* Excluir Permanentemente */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePermanent(account.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Excluir Permanentemente"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Conteúdo */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {account.name}
                          </h3>
                          <p className="text-sm text-slate-400 mb-3 capitalize">
                            {account.type === "CREDIT_CARD"
                              ? "💳 Cartão de Crédito"
                              : account.type?.toLowerCase().replace("_", " ")}
                          </p>

                          {/* Saldo */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">
                                Saldo
                              </p>
                              <p
                                className={`text-xl font-bold ${
                                  account.balance >= 0
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {hiddenBalances[account.id]
                                  ? "••••••"
                                  : formatCurrency(account.balance)}
                              </p>
                            </div>

                            {/* Link Ver Transações */}
                            <Link
                              href={`/painel/transacoes?conta=${account.id}`}
                              className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              Ver transações
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          </div>

                          {/* ✅ INFORMAÇÕES DE CARTÃO DE CRÉDITO */}
                          {account.type === "CREDIT_CARD" &&
                            cartaoData[account.id] && (
                              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg space-y-2">
                                {/* Limite */}
                                {cartaoData[account.id].limite?.total > 0 && (
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-slate-400">
                                        Limite usado
                                      </span>
                                      <span
                                        className={
                                          cartaoData[account.id].limite
                                            .percentualUsado > 80
                                            ? "text-red-400"
                                            : "text-slate-300"
                                        }
                                      >
                                        {
                                          cartaoData[account.id].limite
                                            .percentualUsado
                                        }
                                        %
                                      </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          cartaoData[account.id].limite
                                            .percentualUsado > 90
                                            ? "bg-red-500"
                                            : cartaoData[account.id].limite
                                                  .percentualUsado > 70
                                              ? "bg-amber-500"
                                              : "bg-emerald-500"
                                        }`}
                                        style={{
                                          width: `${Math.min(100, cartaoData[account.id].limite.percentualUsado)}%`,
                                        }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                      <span>
                                        Disponível:{" "}
                                        {hiddenBalances[account.id]
                                          ? "•••"
                                          : formatCurrency(
                                              cartaoData[account.id].limite
                                                .disponivel,
                                            )}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Fatura Atual */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <CreditCard className="w-3 h-3" />
                                    <span>Fatura atual</span>
                                  </div>
                                  <span className="text-white font-medium">
                                    {hiddenBalances[account.id]
                                      ? "•••"
                                      : formatCurrency(
                                          cartaoData[account.id].faturaAtual
                                            ?.total || 0,
                                        )}
                                  </span>
                                </div>

                                {/* Vencimento */}
                                {cartaoData[account.id].faturaAtual
                                  ?.vencimento && (
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                      <Calendar className="w-3 h-3" />
                                      <span>Vencimento</span>
                                    </div>
                                    <span className="text-slate-300">
                                      {new Date(
                                        cartaoData[account.id].faturaAtual
                                          .vencimento,
                                      ).toLocaleDateString("pt-BR")}
                                    </span>
                                  </div>
                                )}

                                {/* Alerta de limite */}
                                {cartaoData[account.id].limite
                                  ?.percentualUsado > 80 && (
                                  <div className="flex items-center gap-1 text-xs text-red-400 pt-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {cartaoData[account.id].limite
                                      .percentualUsado > 95
                                      ? "Limite quase esgotado!"
                                      : "Limite acima de 80%"}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                          <span>
                            Criada em{" "}
                            {new Date(account.createdAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                  </Tooltip>
                ))}
            </div>
          )}

          {/* Resumo no Rodapé */}
          {!loading && !error && accounts.length > 0 && !showArchived && (
            <div className="mt-8 p-4 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-400">
                  <span className="text-white font-semibold">
                    {accounts.filter((a) => a.isActive).length}
                  </span>{" "}
                  contas ativas
                </div>
                <div className="text-lg font-bold text-white">
                  Total:{" "}
                  <span
                    className={
                      accounts.reduce((sum, a) => sum + a.balance, 0) >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {formatCurrency(
                      accounts.reduce((sum, a) => sum + a.balance, 0),
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ✅ MODAL FUTURISTA PARA NOVA CONTA */}
        <NewAccountModal
          isOpen={showNewAccountModal}
          onClose={() => setShowNewAccountModal(false)}
        />
      </div>
    </TooltipProvider>
  );
}
