"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ptBR } from "date-fns/locale";
import {
  ArrowUpDown,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  TrendingUp,
  TrendingDown,
  Filter,
  X,
  Eye,
} from "lucide-react";
// ✅ IMPORT DO NOVO MODAL FUTURISTA
import NewTransactionModal from "./_components/NewTransactionModal";
// Mantém o Drawer caso queira usar como fallback
import { TransactionDrawer } from "./_components/TransactionDrawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// TIPOS E INTERFACES
// ============================================
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  status: "PENDING" | "PAID" | "CANCELLED";
  occurrenceDate: string;
  dueDate?: string | null;
  paidAt?: string | null;
  accountId: string;
  account: {
    id: string;
    name: string;
    color: string;
    icon?: string | null;
  };
  categoryId: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon?: string | null;
    type: "INCOME" | "EXPENSE";
  };
  isRecurring: boolean;
  isInstallment: boolean;
  installmentCurrent?: number | null;
  installmentTotal?: number | null;
  notes?: string | null;
  isReconciled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

interface Account {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  type: "INCOME" | "EXPENSE";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function TransactionsPage() {
  // ============================================
  // ESTADOS
  // ============================================
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  // Filtros
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PAID" | "CANCELLED">("ALL");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Ordenação
  const [sortField, setSortField] = useState<string>("occurrenceDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Contas e Categorias (para filtros e modal)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Resumo financeiro
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  // ============================================
  // ESTADOS DO MODAL FUTURISTA ✅ NOVO
  // ============================================
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);

  // Estados do Drawer (mantido como fallback)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // ============================================
  // FORMATADORES
  // ============================================
  const formatCurrency = (valueInCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valueInCents / 100);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // ============================================
  // BADGES DE STATUS
  // ============================================
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Pago
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "INCOME" ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
        <TrendingUp className="w-3 h-3" />
        Receita
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
        <TrendingDown className="w-3 h-3" />
        Despesa
      </span>
    );
  };

  // ============================================
  // BUSCAR TRANSAÇÕES
  // ============================================
  const fetchTransactions = useCallback(async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      params.set("sortField", sortField);
      params.set("sortOrder", sortOrder);

      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (selectedAccount) params.set("accountId", selectedAccount);
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar transações");
      }

      const data: TransactionsResponse = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);

      // Calcular resumo financeiro
      calculateSummary(data.transactions);
    } catch (err) {
      console.error("Erro ao buscar transações:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [
    status,
    pagination.page,
    pagination.limit,
    sortField,
    sortOrder,
    search,
    typeFilter,
    statusFilter,
    selectedAccount,
    selectedCategory,
    startDate,
    endDate,
  ]);

  // ============================================
  // CALCULAR RESUMO FINANCEIRO
  // ============================================
  const calculateSummary = (transactions: Transaction[]) => {
    const income = transactions
      .filter((t) => t.type === "INCOME" && t.status === "PAID")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "EXPENSE" && t.status === "PAID")
      .reduce((sum, t) => sum + t.amount, 0);

    setSummary({
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    });
  };

  // ============================================
  // BUSCAR CONTAS E CATEGORIAS
  // ============================================
  const fetchFilters = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        fetch("/api/accounts", { credentials: "include" }),
        fetch("/api/categories", { credentials: "include" }),
      ]);

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(Array.isArray(accountsData) ? accountsData : []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }
    } catch (err) {
      console.error("Erro ao buscar filtros:", err);
    }
  }, [status]);

  // ============================================
  // EFFECT PARA ABRIR DRAWER VIA URL
  // ============================================
  useEffect(() => {
    if (searchParams.get("drawer") === "open") {
      handleOpenCreate();
      const url = new URL(window.location.href);
      url.searchParams.delete("drawer");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (status === "authenticated") {
      fetchTransactions();
      fetchFilters();
    }
  }, [status, fetchTransactions, fetchFilters]);

  // ============================================
  // HANDLERS DO MODAL FUTURISTA ✅ NOVO
  // ============================================
  const handleOpenModal = () => {
    setShowNewTransactionModal(true);
  };

  const handleModalClose = () => {
    setShowNewTransactionModal(false);
  };

  const handleModalSuccess = () => {
    setShowNewTransactionModal(false);
    fetchTransactions();
  };

  // ============================================
  // HANDLERS DO DRAWER (mantido como fallback)
  // ============================================
  const handleOpenCreate = () => {
    setDrawerMode("create");
    setEditingTransaction(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (transaction: Transaction) => {
    setDrawerMode("edit");
    setEditingTransaction(transaction);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setEditingTransaction(null);
  };

  const handleDrawerSuccess = () => {
    handleDrawerClose();
    fetchTransactions();
  };

  // ============================================
  // HANDLERS DE AÇÃO
  // ============================================
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination({
      page: 1,
      limit: newLimit,
      total: pagination.total,
      totalPages: pagination.totalPages,
    });
  };

  const handleArchive = async (transactionId: string) => {
    if (!confirm("Tem certeza que deseja arquivar esta transação?")) return;

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao arquivar transação");
      }

      fetchTransactions();
    } catch (err) {
      console.error("Erro ao arquivar:", err);
      alert("Erro ao arquivar transação");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setSelectedAccount("");
    setSelectedCategory("");
    setStartDate("");
    setEndDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExport = () => {
    alert("Funcionalidade de exportação em desenvolvimento");
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando transações...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: NÃO AUTENTICADO
  // ============================================
  if (status === "unauthenticated") {
    router.push("/login");
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
                  onClick={() => router.push("/dashboard")}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ← Voltar
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white">Transações</h1>
                  <p className="text-sm text-slate-400">Gerencie suas receitas e despesas</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:block">Exportar</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exportar transações para CSV ou PDF</p>
                  </TooltipContent>
                </Tooltip>

                {/* ✅ BOTÃO QUE ABRE O MODAL FUTURISTA */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleOpenModal}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:block">Nova Transação</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Criar nova receita ou despesa</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 cursor-help">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Receitas</span>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(summary.totalIncome)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total de receitas no período filtrado</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 cursor-help">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Despesas</span>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(summary.totalExpense)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total de despesas no período filtrado</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 cursor-help">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Saldo do Período</span>
                    <Wallet className="w-5 h-5 text-blue-500" />
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      summary.balance >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(summary.balance)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Diferença entre receitas e despesas</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Filtros */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por descrição..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as any);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="INCOME">🟢 Receitas</option>
                  <option value="EXPENSE">🔴 Despesas</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="PAID">✅ Pago</option>
                  <option value="PENDING">⏳ Pendente</option>
                  <option value="CANCELLED">❌ Cancelado</option>
                </select>

                <select
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todas as Contas</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todas as Categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                  >
                    Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-6 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Tabela de Transações */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden">
            {loading ? (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
) : null}

            {error && !loading && (
              <div className="p-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400">{error}</p>
                  <button
                    onClick={fetchTransactions}
                    className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Wallet className="w-16 h-16 text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma transação encontrada
                </h3>
                <p className="text-slate-400 text-center mb-4">
                  Comece adicionando sua primeira transação financeira
                </p>
                {/* ✅ BOTÃO NO EMPTY STATE TAMBÉM ABRE O MODAL */}
                <button
                  onClick={handleOpenModal}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Nova Transação
                </button>
              </div>
            )}

            {!loading && !error && transactions.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort("description")}
                            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                          >
                            Descrição
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                          Categoria
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                          Conta
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort("occurrenceDate")}
                            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                          >
                            Data
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleSort("amount")}
                            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                          >
                            Valor
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-white">{transaction.description}</p>
                              {transaction.notes && (
                                <p className="text-sm text-slate-500 truncate max-w-xs">
                                  {transaction.notes}
                                </p>
                              )}
                              {transaction.isInstallment && transaction.installmentCurrent && (
                                <p className="text-xs text-amber-400 mt-1">
                                  Parcela {transaction.installmentCurrent} de{" "}
                                  {transaction.installmentTotal}
                                </p>
                              )}
                              {transaction.isRecurring && (
                                <p className="text-xs text-blue-400 mt-1">🔄 Recorrente</p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: transaction.category.color }}
                              />
                              <span className="text-sm text-slate-300">
                                {transaction.category.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: transaction.account.color }}
                              />
                              <span className="text-sm text-slate-300">
                                {transaction.account.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-300">
                              {formatDate(transaction.occurrenceDate)}
                            </span>
                          </td>

                          <td className="px-4 py-4">{getStatusBadge(transaction.status)}</td>
                          <td className="px-4 py-4">{getTypeBadge(transaction.type)}</td>

                          <td className="px-4 py-4 text-right">
                            <span
                              className={`font-semibold ${
                                transaction.type === "INCOME"
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {transaction.type === "INCOME" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleOpenEdit(transaction)}
                                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar transação</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleArchive(transaction.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Arquivar transação</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-slate-800">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">
                      Mostrando{" "}
                      <span className="text-white font-medium">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>{" "}
                      até{" "}
                      <span className="text-white font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{" "}
                      de <span className="text-white font-medium">{pagination.total}</span>{" "}
                      transações
                    </span>

                    <select
                      value={pagination.limit}
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
                      className="px-3 py-1 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={10}>10 por página</option>
                      <option value={25}>25 por página</option>
                      <option value={50}>50 por página</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-sm text-slate-400">
                      Página <span className="text-white font-medium">{pagination.page}</span> de{" "}
                      <span className="text-white font-medium">{pagination.totalPages}</span>
                    </span>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        {/* ✅ MODAL FUTURISTA PARA NOVA TRANSAÇÃO */}
        <NewTransactionModal 
          isOpen={showNewTransactionModal}
          onClose={handleModalClose}
          accounts={accounts}
          categories={categories}
          onSuccess={handleModalSuccess}
        />

        {/* Drawer mantido como fallback (pode remover se não quiser usar) */}
        <TransactionDrawer
          open={isDrawerOpen}
          onOpenChange={handleDrawerClose}
          transaction={editingTransaction}
          mode={drawerMode}
          onSuccess={handleDrawerSuccess}
        />
      </div>
    </TooltipProvider>
  );
}