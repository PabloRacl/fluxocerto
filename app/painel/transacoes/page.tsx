"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Skeleton } from "@/componentes/ui/skeleton";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { ptBR } from "date-fns/locale";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";
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
  Archive,
  ArchiveRestore,
  Activity,
  Zap,
  CreditCard as CardIcon,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// ✅ IMPORT DO NOVO MODAL FUTURISTA
import NewTransactionModal from "./_componentes/NewTransactionModal";
// Mantém o Drawer caso queira usar como fallback
import { TransactionDrawer } from "./_componentes/TransactionDrawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";

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
  isArchived: boolean; // ✅ CAMPO PARA ARQUIVAMENTO
  archivedAt?: string | null;
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
  counts?: {
    totalActive: number;
    totalArchived: number;
  };
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

  // ✅ NOVO: Filtro para mostrar transações ativas ou arquivadas
  const [showArchived, setShowArchived] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "PAID" | "CANCELLED"
  >("ALL");
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

  const [globalCounts, setGlobalCounts] = useState({
    totalActive: 0,
    totalArchived: 0,
  });

  // ============================================
  // ESTADOS DO MODAL FUTURISTA ✅ NOVO
  // ============================================
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<"INCOME" | "EXPENSE" | undefined>(undefined);

  // Estados do Drawer (mantido como fallback)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

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
      params.set("showArchived", showArchived.toString()); // ✅ PARÂMETRO PARA ARQUIVADAS

      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (selectedAccount) params.set("accountId", selectedAccount);
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(`/api/transacoes?${params.toString()}`, {
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
      if (data.counts) {
        setGlobalCounts(data.counts);
      }

      // Calcular resumo financeiro (apenas transações ativas)
      if (!showArchived) {
        calculateSummary(data.transactions);
      } else {
        setSummary({ totalIncome: 0, totalExpense: 0, balance: 0 });
      }
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
    showArchived, // ✅ DEPENDÊNCIA ADICIONADA
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
        fetch("/api/contas", { credentials: "include" }),
        fetch("/api/categorias", { credentials: "include" }),
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
      const type = searchParams.get("type") as "INCOME" | "EXPENSE" | undefined;
      handleOpenCreate(type);
      const url = new URL(window.location.href);
      url.searchParams.delete("drawer");
      url.searchParams.delete("type");
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
  const handleOpenModal = (type?: "INCOME" | "EXPENSE") => {
    setModalInitialType(type);
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
  const handleOpenCreate = (type?: "INCOME" | "EXPENSE") => {
    // Agora sempre delega a criação para o novo modal
    handleOpenModal(type);
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

  // ✅ ARQUIVAR/DESARQUIVAR TRANSAÇÃO
  const handleArchive = async (transactionId: string, isArchived: boolean) => {
    const action = isArchived ? "desarquivar" : "arquivar";
    if (!confirm(`Tem certeza que deseja ${action} esta transação?`)) return;

    try {
      const response = await fetch(`/api/transacoes/${transactionId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !isArchived }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao ${action} transação`);
      }

      fetchTransactions();
    } catch (err) {
      console.error(`Erro ao ${action}:`, err);
      alert(`Erro ao ${action} transação`);
    }
  };

  const handleDeletePermanent = async (transactionId: string) => {
    if (
      !confirm(
        "⚠️ ATENÇÃO: Esta é uma EXCLUSÃO PERMANENTE.\nA transação será destruída do sistema para sempre sem volta. Deseja prosseguir com a deleção?",
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/transacoes/${transactionId}/exclusao-permanente`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao excluir transação`);
      }

      fetchTransactions();
    } catch (err) {
      console.error(`Erro ao excluir permanente:`, err);
      alert(`Erro ao excluir transação`);
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
    router.push("/painel/relatorios");
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (status === "loading") {
    return <NeuralLoading message="Processando Matriz de Transações..." variant="full" />;
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
        {/* ✅ HEADER PADRONIZADO COM O NOVO BREADCRUMB */}
        <PageHeader
          title="Transações e Movimentações"
          description="Monitore seu fluxo de caixa e categorize suas receitas e despesas"
          breadcrumbs={[{ label: "Transações" }]}
        >
          {/* Toggle Ativas/Lixeira */}
          <div className="flex items-center gap-2 mr-2">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setShowArchived(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!showArchived ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Wallet className="w-3 h-3" />
                Ativas
                {globalCounts.totalActive > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${!showArchived ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                    {globalCounts.totalActive}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showArchived ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Archive className="w-3 h-3" />
                Lixeira
                {globalCounts.totalArchived > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${showArchived ? "bg-amber-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                    {globalCounts.totalArchived}
                  </span>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={fetchTransactions}
            className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Nova Transação */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:block">Nova Transação</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cadastrar nova transação</p>
            </TooltipContent>
          </Tooltip>
        </PageHeader>
        
        {/* Conteúdo Principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ✅ MENSAGEM DE INFO QUANDO NA LIXEIRA */}
          {showArchived && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <Archive className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Visualizando transações arquivadas
                </p>
                <p className="text-xs text-amber-300 mt-1">
                  Transações arquivadas não aparecem no dashboard. Você pode
                  restaurá-las.
                </p>
              </div>
            </div>
          )}

          {/* Resumo Financeiro HUD 2.0 */}
          {!showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
              {/* Card: Receitas */}
              <div className="bg-slate-950/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  style={{ skewX: -20 }}
                />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fluxo Entrada</span>
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-400 ml-1 relative z-10 transition-transform group-hover:scale-105 origin-left" style={{ textShadow: "0 0 20px rgba(16,185,129,0.3)" }}>
                  {formatCurrency(summary.totalIncome)}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-800/30 overflow-hidden">
                   <motion.div 
                     className="h-full bg-emerald-500/50"
                     initial={{ x: "-100%" }}
                     whileHover={{ x: "0%" }}
                     transition={{ duration: 0.6 }}
                   />
                </div>
              </div>

              {/* Card: Despesas */}
              <div className="bg-slate-950/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  style={{ skewX: -20 }}
                />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Consumo Neural</span>
                  </div>
                </div>
                <p className="text-2xl font-black text-red-500 ml-1 relative z-10 transition-transform group-hover:scale-105 origin-left" style={{ textShadow: "0 0 20px rgba(239,68,68,0.3)" }}>
                  {formatCurrency(summary.totalExpense)}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-800/30 overflow-hidden">
                   <motion.div 
                     className="h-full bg-red-500/50"
                     initial={{ x: "-100%" }}
                     whileHover={{ x: "0%" }}
                     transition={{ duration: 0.6 }}
                   />
                </div>
              </div>

              {/* Card: Saldo */}
              <div className="bg-slate-950/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  style={{ skewX: -20 }}
                />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Balanceamento</span>
                  </div>
                </div>
                <p 
                  className={`text-2xl font-black ml-1 relative z-10 transition-transform group-hover:scale-105 origin-left ${summary.balance >= 0 ? "text-emerald-400" : "text-red-400"}`} 
                  style={{ textShadow: `0 0 20px ${summary.balance >= 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}
                >
                  {formatCurrency(summary.balance)}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-800/30 overflow-hidden">
                   <motion.div 
                     className="h-full bg-blue-500/50"
                     initial={{ x: "-100%" }}
                     whileHover={{ x: "0%" }}
                     transition={{ duration: 0.6 }}
                   />
                </div>
              </div>
            </div>
          )}

          {/* Filtros Neural HUD */}
          <div className="bg-slate-950/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/5 mb-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <form onSubmit={handleSearch} className="space-y-6 relative z-10">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative group/input">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-emerald-400 transition-colors" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="IDENTIFICAR TRANSAÇÃO NO DATASTREAM..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-[2]">
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value as any);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="px-4 py-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  >
                    <option value="ALL">MODOS: TODOS</option>
                    <option value="INCOME">ENTRADAS (+)</option>
                    <option value="EXPENSE">SAÍDAS (-)</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="px-4 py-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  >
                    <option value="ALL">STATUS: GLOBAL</option>
                    <option value="PAID">AUTORIZADO</option>
                    <option value="PENDING">EM ESPERA</option>
                    <option value="CANCELLED">BLOQUEADO</option>
                  </select>

                  <select
                    value={selectedAccount}
                    onChange={(e) => {
                      setSelectedAccount(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="px-4 py-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  >
                    <option value="">NÓDULOS: TODOS</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name.toUpperCase()}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="px-4 py-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  >
                    <option value="">TAGS: TODAS</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">
                      Início de Ciclo
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[10px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">
                      Fim de Ciclo
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[10px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5"
                >
                  Reset Matriz
                </button>
              </div>
            </form>
          </div>

          {/* Tabela de Transações HUD 2.0 */}
          <div className="bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : null}

            {error && !loading && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                  <Activity className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-400 font-black uppercase tracking-widest text-sm mb-4">{error}</p>
                <button
                  onClick={fetchTransactions}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all"
                >
                  Tentar Reinicializar
                </button>
              </div>
            )}

            {!loading && !error && transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6 border border-white/5">
                  {showArchived ? (
                    <Archive className="w-10 h-10 text-slate-600" />
                  ) : (
                    <Layers className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">
                  {showArchived ? "Arquivo Vazio" : "Pulso não Detectado"}
                </h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest text-center mb-8 max-w-xs leading-relaxed">
                  {showArchived
                    ? "Nenhum dado arquivado nos registros de sistema."
                    : "O fluxo de transações está estático. Inicie uma nova entrada de dados."}
                </p>
                {!showArchived && (
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Transação
                  </button>
                )}
              </div>
            )}

            {!loading && !error && transactions.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleSort("description")}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors"
                          >
                            Identificação
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Classe
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Nódulo
                        </th>
                        <th className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleSort("occurrenceDate")}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors"
                          >
                            Timestamp
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleSort("amount")}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors ml-auto"
                          >
                            Magnitude
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Operações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className={`group hover:bg-white/[0.02] transition-colors relative ${
                            transaction.isArchived ? "opacity-40" : ""
                          }`}
                        >
                          <td className="px-6 py-5">
                            <div className="relative z-10">
                              <p className="text-xs font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                                {transaction.description}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {transaction.isInstallment && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    PCL: {transaction.installmentCurrent}/{transaction.installmentTotal}
                                  </span>
                                )}
                                {transaction.isRecurring && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    Loop-Sync
                                  </span>
                                )}
                                {transaction.notes && (
                                  <span className="text-[9px] font-medium text-slate-500 italic max-w-[150px] truncate">
                                    {"// " + transaction.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                                style={{
                                  backgroundColor: transaction.category.color,
                                  color: transaction.category.color
                                }}
                              />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {transaction.category.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center">
                                <CardIcon className="w-3 h-3 text-slate-500" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {transaction.account.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="text-[10px] font-black tabular-nums text-slate-500 tracking-wider">
                              {formatDate(transaction.occurrenceDate)}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="scale-90 origin-left">
                              {getStatusBadge(transaction.status)}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <div className="flex flex-col items-end">
                              <span
                                className={`text-[13px] font-black tabular-nums tracking-tight ${
                                  transaction.type === "INCOME"
                                    ? "text-emerald-400"
                                    : "text-red-500"
                                }`}
                                style={{
                                  textShadow: `0 0 15px ${transaction.type === "INCOME" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`
                                }}
                              >
                                {transaction.type === "INCOME" ? "+" : "-"} {formatCurrency(transaction.amount)}
                              </span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 mt-0.5">
                                BRL_SYNC
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {showArchived ? (
                                <>
                                  <button
                                    onClick={() => handleArchive(transaction.id, true)}
                                    className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                                    title="Restaurar"
                                  >
                                    <ArchiveRestore className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePermanent(transaction.id)}
                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Excluir Permanente"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(transaction)}
                                    className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleArchive(transaction.id, false)}
                                    className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all"
                                  >
                                    <Archive className="w-4 h-4" />
                                  </button>
                                </>
                              )}
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
                        {Math.min(
                          pagination.page * pagination.limit,
                          pagination.total,
                        )}
                      </span>{" "}
                      de{" "}
                      <span className="text-white font-medium">
                        {pagination.total}
                      </span>{" "}
                      transações
                    </span>

                    <select
                      value={pagination.limit}
                      onChange={(e) =>
                        handleLimitChange(Number(e.target.value))
                      }
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
                      Página{" "}
                      <span className="text-white font-medium">
                        {pagination.page}
                      </span>{" "}
                      de{" "}
                      <span className="text-white font-medium">
                        {pagination.totalPages}
                      </span>
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

        {/* ✅ MODAL FUTURISTA */}
        {showNewTransactionModal && (
          <NewTransactionModal
            isOpen={showNewTransactionModal}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
            initialType={modalInitialType}
            accounts={accounts}
            categories={categories}
          />
        )}

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
