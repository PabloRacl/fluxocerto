"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/componentes/ui/dialog";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentes/ui/select";
import { Label } from "@/componentes/ui/label";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";
import {
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Wallet,
  Tag,
  Calendar,
  FileText,
  Repeat,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// TIPOS E INTERFACES
// ============================================
interface Account {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  type: "INCOME" | "EXPENSE";
}

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
  categoryId: string;
  notes?: string | null;
  isRecurring: boolean;
  recurrenceType?: string | null;
  recurrenceDay?: number | null;
  isInstallment: boolean;
  installmentTotal?: number | null;
  installmentCurrent?: number | null;
  installmentId?: string | null;
}

interface TransactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  mode: "create" | "edit";
  onSuccess: () => void;
}

// ============================================
// FORMATADOR DE MOEDA
// ============================================
const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};

const parseCurrencyToCents = (value: string): number => {
  const digits = value.replace(/\D/g, "");
  return parseInt(digits) || 0;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function TransactionDrawer({
  open,
  onOpenChange,
  transaction,
  mode,
  onSuccess,
}: TransactionDrawerProps) {
  // ============================================
  // ESTADOS
  // ============================================
  const router = useRouter();

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    amountInCents: 0,
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    status: "PAID" as "PENDING" | "PAID" | "CANCELLED",
    accountId: "",
    categoryId: "",
    occurrenceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    isRecurring: false,
    recurrenceType: "MONTHLY" as string,
    recurrenceDay: 1,
    isInstallment: false,
    installmentTotal: 1,
    installmentCurrent: 1,
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const [showOtherAccount, setShowOtherAccount] = useState(false);
  const [customAccount, setCustomAccount] = useState("");
  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // ============================================
  // BUSCAR CONTAS E CATEGORIAS
  // ============================================
  const fetchAccountsAndCategories = useCallback(async () => {
    if (!open || hasLoadedData) return;

    setFetchingData(true);
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        fetch("/api/contas"),
        fetch("/api/categorias"),
      ]);

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData);
        if (
          mode === "create" &&
          accountsData.length > 0 &&
          !formData.accountId
        ) {
          setFormData((prev) => ({ ...prev, accountId: accountsData[0].id }));
        }
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
        if (
          mode === "create" &&
          categoriesData.length > 0 &&
          !formData.categoryId
        ) {
          const firstCategory = categoriesData.find(
            (c: Category) => c.type === formData.type,
          );
          if (firstCategory) {
            setFormData((prev) => ({ ...prev, categoryId: firstCategory.id }));
          }
        }
      }

      setHasLoadedData(true);
    } catch (err) {
      console.error("Erro ao buscar contas e categorias:", err);
    } finally {
      setFetchingData(false);
    }
  }, [
    open,
    hasLoadedData,
    mode,
    formData.type,
    formData.accountId,
    formData.categoryId,
  ]);

  // ============================================
  // PREENCHER FORMULÁRIO PARA EDIÇÃO
  // ============================================
  useEffect(() => {
    if (open && mode === "edit" && transaction) {
      setFormData({
        description: transaction.description,
        amount: formatCurrency(transaction.amount),
        amountInCents: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        occurrenceDate: transaction.occurrenceDate.split("T")[0],
        dueDate: transaction.dueDate ? transaction.dueDate.split("T")[0] : "",
        notes: transaction.notes || "",
        isRecurring: transaction.isRecurring,
        recurrenceType: transaction.recurrenceType || "MONTHLY",
        recurrenceDay: transaction.recurrenceDay || 1,
        isInstallment: transaction.isInstallment,
        installmentTotal: transaction.installmentTotal || 1,
        installmentCurrent: transaction.installmentCurrent || 1,
      });
    } else if (open && mode === "create") {
      setFormData({
        description: "",
        amount: "",
        amountInCents: 0,
        type: "EXPENSE",
        status: "PAID",
        accountId: accounts[0]?.id || "",
        categoryId: "",
        occurrenceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        notes: "",
        isRecurring: false,
        recurrenceType: "MONTHLY",
        recurrenceDay: 1,
        isInstallment: false,
        installmentTotal: 1,
        installmentCurrent: 1,
      });
    }
  }, [open, mode, transaction, accounts]);

  // ============================================
  // BUSCAR DADOS AO ABRIR (apenas uma vez)
  // ============================================
  useEffect(() => {
    if (open && !hasLoadedData) {
      fetchAccountsAndCategories();
    }
  }, [open, hasLoadedData, fetchAccountsAndCategories]);

  // ============================================
  // RESETAR HASLOADED QUANDO FECHAR
  // ============================================
  useEffect(() => {
    if (!open) {
      setHasLoadedData(false);
      setErrors({});
    }
  }, [open]);

  // ============================================
  // VALIDAÇÕES
  // ============================================
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = "Descrição é obrigatória";
    }

    if (!formData.amountInCents || formData.amountInCents <= 0) {
      newErrors.amount = "Valor deve ser maior que zero";
    }

    if (!formData.accountId) {
      newErrors.accountId = "Conta é obrigatória";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Categoria é obrigatória";
    }

    if (!formData.occurrenceDate) {
      newErrors.occurrenceDate = "Data de ocorrência é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cents = parseCurrencyToCents(value);

    const formatted = (cents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setFormData((prev) => ({
      ...prev,
      amount: formatted,
      amountInCents: cents,
    }));

    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: "" }));
    }
  };

  const handleTypeChange = (type: "INCOME" | "EXPENSE") => {
    setFormData((prev) => ({
      ...prev,
      type,
      categoryId: "",
    }));

    if (errors.categoryId) {
      setErrors((prev) => ({ ...prev, categoryId: "" }));
    }
  };

  const handleAccountChange = (value: string) => {
    if (value === "OTHER_ACCOUNT") {
      setShowOtherAccount(true);
      setFormData((prev) => ({ ...prev, accountId: "" }));
    } else {
      setShowOtherAccount(false);
      setFormData((prev) => ({ ...prev, accountId: value }));
      setCustomAccount("");
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "OTHER_CATEGORY") {
      setShowOtherCategory(true);
      setFormData((prev) => ({ ...prev, categoryId: "" }));
    } else {
      setShowOtherCategory(false);
      setFormData((prev) => ({ ...prev, categoryId: value }));
      setCustomCategory("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() && !showOtherAccount && !showOtherCategory) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setLoading(true);

    try {
      let finalAccountId = formData.accountId;
      let finalCategoryId = formData.categoryId;

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

      // Criar nova categoria se necessário
      if (showOtherCategory && customCategory.trim()) {
        const catRes = await fetch("/api/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customCategory.trim(),
            type: formData.type,
            color: formData.type === "INCOME" ? "#10B981" : "#EF4444",
            icon: formData.type === "INCOME" ? "TrendingUp" : "TrendingDown",
          }),
        });

        if (!catRes.ok) throw new Error("Erro ao criar a nova categoria");
        const catData = await catRes.json();
        finalCategoryId = catData.category?.id || catData.id;
      }

      if (!finalAccountId) throw new Error("Selecione ou crie uma conta");
      if (!finalCategoryId) throw new Error("Selecione ou crie uma categoria");

      const url =
        mode === "create"
          ? "/api/transacoes"
          : `/api/transacoes/${transaction?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const body = {
        description: formData.description.trim(),
        amount: formData.amountInCents,
        type: formData.type,
        status: formData.status,
        accountId: finalAccountId,
        categoryId: finalCategoryId,
        occurrenceDate: formData.occurrenceDate,
        dueDate: formData.dueDate || null,
        notes: formData.notes.trim() || null,
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : null,
        recurrenceDay: formData.isRecurring ? formData.recurrenceDay : null,
        isInstallment: formData.isInstallment,
        installmentTotal: formData.isInstallment
          ? formData.installmentTotal
          : null,
        installmentCurrent: formData.isInstallment
          ? formData.installmentCurrent
          : null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar transação");
      }

      toast.success(
        mode === "create"
          ? "Transação criada com sucesso!"
          : "Transação atualizada com sucesso!",
      );

      onOpenChange(false);
      onSuccess();
      router.refresh();
    } catch (err) {
      console.error("Erro ao salvar transação:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar transação",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // ============================================
  // FILTRAR CATEGORIAS POR TIPO
  // ============================================
  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type,
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <AnimatedModal
      isOpen={open}
      onClose={handleClose}
      title={mode === "create" ? "Nova Transação" : "Editar Transação"}
      subtitle={mode === "create" ? "Preencha os dados da transação" : "Atualize os dados da transação"}
      icon={
        formData.type === "INCOME" ? (
          <TrendingUp className="w-6 h-6 text-white" />
        ) : (
          <TrendingDown className="w-6 h-6 text-white" />
        )
      }
      theme={formData.type === "INCOME" ? "emerald" : "red"}
      maxWidth="3xl"
    >
        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* TIPO E STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-slate-300 mb-2 block">
                Tipo de Transação
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange("EXPENSE")}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    formData.type === "EXPENSE"
                      ? "bg-red-500/20 text-red-400 border-2 border-red-500"
                      : "bg-slate-800 text-slate-400 border-2 border-transparent hover:border-slate-700"
                  }`}
                >
                  💸 Despesa
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("INCOME")}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    formData.type === "INCOME"
                      ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500"
                      : "bg-slate-800 text-slate-400 border-2 border-transparent hover:border-slate-700"
                  }`}
                >
                  💰 Receita
                </button>
              </div>
            </div>

            <div className="relative">
              <Label className="text-sm text-slate-300 mb-2 block">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="bg-slate-800 border-slate-700 z-[110]"
                  position="popper"
                  side="bottom"
                  align="start"
                >
                  <SelectItem value="PAID" className="text-white">
                    ✅ Pago
                  </SelectItem>
                  <SelectItem value="PENDING" className="text-white">
                    ⏳ Pendente
                  </SelectItem>
                  <SelectItem value="CANCELLED" className="text-white">
                    ❌ Cancelado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DESCRIÇÃO E VALOR */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-slate-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Descrição *
              </Label>
              <Input
                value={formData.description}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }));
                  if (errors.description) {
                    setErrors((prev) => ({ ...prev, description: "" }));
                  }
                }}
                placeholder="Ex: Salário, Mercado, Aluguel..."
                className={`bg-slate-800 border-slate-700 text-white placeholder-slate-500 ${
                  errors.description ? "border-red-500" : ""
                }`}
              />
              {errors.description && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Valor *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  R$
                </span>
                <Input
                  value={formData.amount}
                  onChange={handleAmountChange}
                  placeholder="0,00"
                  className={`bg-slate-800 border-slate-700 text-white placeholder-slate-500 pl-12 ${
                    errors.amount ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-red-400 mt-1">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* CONTA E CATEGORIA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Label className="text-sm text-slate-300 mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Conta *
              </Label>
              <Select
                value={showOtherAccount ? "OTHER_ACCOUNT" : formData.accountId}
                onValueChange={handleAccountChange}
              >
                <SelectTrigger
                  className={`bg-slate-800 border-slate-700 text-white ${
                    errors.accountId ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent
                  className="bg-slate-800 border-slate-700 z-[110]"
                  position="popper"
                  side="bottom"
                  align="start"
                >
                  {fetchingData ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : (
                    <>
                      {accounts.map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.id}
                          className="text-white"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: account.color }}
                            />
                            {account.name}
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="OTHER_ACCOUNT" className="text-emerald-400 font-bold italic">
                        ➕ Outra Conta...
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              {showOtherAccount && (
                <div className="mt-2 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl animate-in fade-in slide-in-from-top-1">
                  <Input 
                    placeholder="Nome da nova conta"
                    value={customAccount}
                    onChange={(e) => setCustomAccount(e.target.value)}
                    className="h-9 text-xs bg-slate-900 border-slate-700 focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              )}
              {errors.accountId && (
                <p className="text-xs text-red-400 mt-1">{errors.accountId}</p>
              )}
            </div>

            <div className="relative">
              <Label className="text-sm text-slate-300 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categoria *
              </Label>
              <Select
                value={showOtherCategory ? "OTHER_CATEGORY" : formData.categoryId}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger
                  className={`bg-slate-800 border-slate-700 text-white ${
                    errors.categoryId ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent
                  className="bg-slate-800 border-slate-700 z-[110]"
                  position="popper"
                  side="bottom"
                  align="start"
                >
                  {fetchingData ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : (
                    <>
                      {categories
                        .filter((c) => c.type === formData.type)
                        .map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className="text-white"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      <SelectItem value="OTHER_CATEGORY" className="text-emerald-400 font-bold italic">
                        ➕ Outra Categoria...
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              {showOtherCategory && (
                <div className="mt-2 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl animate-in fade-in slide-in-from-top-1">
                  <Input 
                    placeholder="Nome da nova categoria"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="h-9 text-xs bg-slate-900 border-slate-700 focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              )}
              {errors.categoryId && (
                <p className="text-xs text-red-400 mt-1">{errors.categoryId}</p>
              )}
            </div>
          </div>

          {/* DATAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-slate-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Ocorrência *
              </Label>
              <Input
                type="date"
                value={formData.occurrenceDate}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    occurrenceDate: e.target.value,
                  }));
                  if (errors.occurrenceDate) {
                    setErrors((prev) => ({ ...prev, occurrenceDate: "" }));
                  }
                }}
                className={`bg-slate-800 border-slate-700 text-white ${
                  errors.occurrenceDate ? "border-red-500" : ""
                }`}
              />
              {errors.occurrenceDate && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.occurrenceDate}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Vencimento
              </Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* OBSERVAÇÕES */}
          <div>
            <Label className="text-sm text-slate-300 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Observações
            </Label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Adicione detalhes ou notas sobre esta transação..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* OPÇÕES AVANÇADAS */}
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Repeat className="w-4 h-4 text-slate-400" />
              <h4 className="text-sm font-semibold text-white">
                Opções Avançadas
              </h4>
            </div>

            {/* Recorrência */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Repeat className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Transação Recorrente
                  </p>
                  <p className="text-xs text-slate-400">
                    Repetir automaticamente
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isRecurring: e.target.checked,
                  }))
                }
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-800/50 rounded-lg">
                <div className="relative">
                  <Label className="text-xs text-slate-400 mb-1 block">
                    Frequência
                  </Label>
                  <Select
                    value={formData.recurrenceType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurrenceType: value,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-slate-700 border-slate-600 z-[110]"
                      position="popper"
                      side="bottom"
                      align="start"
                    >
                      <SelectItem value="DAILY" className="text-white">
                        Diário
                      </SelectItem>
                      <SelectItem value="WEEKLY" className="text-white">
                        Semanal
                      </SelectItem>
                      <SelectItem value="BIWEEKLY" className="text-white">
                        Quinzenal
                      </SelectItem>
                      <SelectItem value="MONTHLY" className="text-white">
                        Mensal
                      </SelectItem>
                      <SelectItem value="ANNUAL" className="text-white">
                        Anual
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">
                    Dia de Repetição
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.recurrenceDay}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurrenceDay: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="bg-slate-700 border-slate-600 text-white h-9"
                  />
                </div>
              </div>
            )}

            {/* Parcelas */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-white">Parcelado</p>
                  <p className="text-xs text-slate-400">
                    Dividir em múltiplas parcelas
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.isInstallment}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isInstallment: e.target.checked,
                  }))
                }
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
            </div>

            {formData.isInstallment && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">
                    Total de Parcelas
                  </Label>
                  <Input
                    type="number"
                    min="2"
                    max="48"
                    value={formData.installmentTotal}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({
                        ...prev,
                        installmentTotal: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="bg-slate-700 border-slate-600 text-white h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">
                    Parcela Atual
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max={formData.installmentTotal}
                    value={formData.installmentCurrent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({
                        ...prev,
                        installmentCurrent: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="bg-slate-700 border-slate-600 text-white h-9"
                  />
                </div>
              </div>
            )}
          </div>

          {/* BOTÕES DE AÇÃO */}
          {/* BOTÕES DE AÇÃO */}
          <div className="flex gap-4 pt-4 sticky bottom-0 bg-slate-900/80 backdrop-blur-sm -mx-2 px-2 pb-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-2xl transition-all border border-slate-800 hover:border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 bg-gradient-to-r font-semibold rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 ${
                formData.type === "INCOME" 
                  ? "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20" 
                  : "from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20"
              }`}
            >
              {loading ? (
                <NeuralLoading message="Sincronizando..." variant="inline" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {mode === "create" ? "Criar Transação" : "Salvar Alterações"}
                </>
              )}
            </button>
          </div>
        </form>
    </AnimatedModal>
  );
}
