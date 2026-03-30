"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  TrendingUp,
  TrendingDown,
  Check,
  Calendar,
  Tag,
  Wallet,
} from "lucide-react";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";

// Tipos de transação
const TRANSACTION_TYPES = [
  {
    value: "INCOME",
    label: "💰 Receita",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    value: "EXPENSE",
    label: "💸 Despesa",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
];

// Status
const STATUS_OPTIONS = [
  { value: "PAID", label: "✅ Pago" },
  { value: "PENDING", label: "⏳ Pendente" },
];

// ✅ INTERFACE CORRIGIDA COM onSuccess
interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  accounts?: any[];
  categories?: any[];
  initialType?: "INCOME" | "EXPENSE"; // ✅ NOVO: Tipo inicial
}

export default function NewTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  accounts = [],
  categories = [],
  initialType, // ✅ Recebe a prop
}: NewTransactionModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "EXPENSE",
    accountId: "",
    categoryId: "",
    occurrenceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    status: "PAID",
    notes: "",
  });

  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const [showOtherAccount, setShowOtherAccount] = useState(false);
  const [customAccount, setCustomAccount] = useState("");

  // Animação de entrada/saída e configuração inicial
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      
      // ✅ Se vier um tipo inicial (do Dashboard), aplica
      if (initialType) {
        setFormData(prev => ({ ...prev, type: initialType }));
      }
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialType]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
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
    if (value === "OTHER") {
      setShowOtherCategory(true);
      setFormData((prev) => ({ ...prev, categoryId: "" }));
    } else {
      setShowOtherCategory(false);
      setFormData((prev) => ({ ...prev, categoryId: value }));
      setCustomCategory("");
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let finalCategoryId = formData.categoryId;
      let finalAccountId = formData.accountId;

      // Criar nova conta se necessário
      if (showOtherAccount && customAccount.trim()) {
        const accRes = await fetch("/api/contas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customAccount.trim(),
            type: "CHECKING_ACCOUNT",
            color: "#6366F1",
            balance: 0,
          }),
        });

        if (!accRes.ok) throw new Error("Erro ao criar a nova conta");
        const accData = await accRes.json();
        finalAccountId = accData.id;
      }

      // Se a categoria personalizada foi selecionada, devemos criá-la antes
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
        // Fallback robusto garantindo extração certa do ID da categoria nova
        finalCategoryId = catData.category?.id || catData.id;
      }

      if (
        !formData.description ||
        !formData.amount ||
        !formData.accountId ||
        !finalCategoryId
      ) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      const amountInCents = Math.round(parseFloat(formData.amount) * 100);

      const res = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: finalCategoryId,
          accountId: finalAccountId,
          amount: amountInCents,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar transação");
      }

      // ✅ CHAMA onSuccess SE EXISTIR
      if (onSuccess) {
        onSuccess();
      }

      // Fecha o modal
      onClose();
      // Atualiza a página
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao criar transação");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorias pelo tipo selecionado
  const filteredCategories = categories.filter(
    (cat: any) => !cat.parentCategoryId && cat.type === formData.type,
  );

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Transação"
      subtitle="Registre uma receita ou despesa"
      icon={
        formData.type === "INCOME" ? (
          <TrendingUp className="w-6 h-6 text-white" />
        ) : (
          <TrendingDown className="w-6 h-6 text-white" />
        )
      }
      theme={formData.type === "INCOME" ? "emerald" : "red"}
      maxWidth="2xl"
    >
            {/* Formulário */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 max-h-[70vh] overflow-y-auto"
            >
              {/* Mensagem de Erro */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 animate-pulse">
                  {error}
                </div>
              )}

              {/* Tipo de Transação */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {TRANSACTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange("type", type.value)}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all duration-200 ${
                        formData.type === type.value
                          ? `border-emerald-500 ${type.bgColor} shadow-lg`
                          : "border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50"
                      }`}
                    >
                      <span
                        className={
                          formData.type === type.value
                            ? type.color
                            : "text-slate-400"
                        }
                      >
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição e Valor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="Ex: Salário, Mercado, etc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => handleChange("amount", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              {/* Conta e Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Wallet className="w-4 h-4 inline mr-1" />
                    Conta *
                  </label>
                  <select
                    value={showOtherAccount ? "OTHER_ACCOUNT" : formData.accountId}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    required
                  >
                    <option value="">Selecione...</option>
                    {accounts
                      .filter((a: any) => a.isActive)
                      .map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({formatCurrency(acc.balance)})
                        </option>
                      ))}
                    <option value="OTHER_ACCOUNT">➕ Outra Conta...</option>
                  </select>

                  {/* Campo personalizado para "Outra Conta" */}
                  {showOtherAccount && (
                    <div className="mt-3 p-3 bg-slate-800/30 border border-slate-700 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <input
                        type="text"
                        value={customAccount}
                        onChange={(e) => setCustomAccount(e.target.value)}
                        placeholder="Nome da nova conta"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm"
                        autoFocus
                        required
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Categoria *
                  </label>
                  <select
                    value={showOtherCategory ? "OTHER" : formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    required
                  >
                    <option value="">Selecione...</option>
                    {filteredCategories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="OTHER">➕ Outra...</option>
                  </select>

                  {/* Campo personalizado para "Outro" */}
                  {showOtherCategory && (
                    <div className="mt-3 p-3 bg-slate-800/30 border border-slate-700 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Nome da nova categoria"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm"
                        autoFocus
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data da Ocorrência
                  </label>
                  <input
                    type="date"
                    value={formData.occurrenceDate}
                    onChange={(e) =>
                      handleChange("occurrenceDate", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleChange("dueDate", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <div className="flex gap-3">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => handleChange("status", status.value)}
                      className={`flex-1 p-3 rounded-2xl border-2 transition-all duration-200 ${
                        formData.status === status.value
                          ? "border-emerald-500 bg-emerald-500/10 shadow-lg"
                          : "border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50"
                      }`}
                    >
                      <span
                        className={`text-sm ${formData.status === status.value ? "text-emerald-400" : "text-slate-400"}`}
                      >
                        {status.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  placeholder="Adicione detalhes sobre esta transação..."
                />
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-2xl transition-all border border-slate-700 hover:border-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.description ||
                    !formData.amount ||
                    !formData.accountId ||
                    (showOtherCategory && !customCategory.trim())
                  }
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <NeuralLoading message="Processando..." variant="inline" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Criar Transação
                    </>
                  )}
                </button>
              </div>
            </form>
    </AnimatedModal>
  );
}

// Helper para formatar moeda
const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};
