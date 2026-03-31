"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Check, AlertCircle, Calendar, Wallet, Tag } from "lucide-react";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";

interface EditDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: any;
}

export default function EditDebtModal({
  isOpen,
  onClose,
  debt,
}: EditDebtModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    totalAmount: "",
    installmentValue: "",
    installmentTotal: "",
    installmentPaid: "",
    interestRate: "",
    amortizationType: "",
    startDate: "",
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

  // Carregar dados iniciais e dependências
  useEffect(() => {
    if (isOpen) {
      // Buscar contas e categorias
      fetch("/api/contas", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setAccounts(Array.isArray(d) ? d : d.accounts || []));
      fetch("/api/categorias?type=EXPENSE", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setCategories(Array.isArray(d) ? d : []));
    }
  }, [isOpen]);

  // Preencher formulário com dados da dívida
  useEffect(() => {
    if (debt && isOpen) {
      setForm({
        name: debt.name || "",
        totalAmount: (debt.totalAmount / 100).toString(),
        installmentValue: (debt.installmentValue / 100).toString(),
        installmentTotal: debt.installmentTotal.toString(),
        installmentPaid: debt.installmentPaid.toString(),
        interestRate: debt.interestRate ? debt.interestRate.toString() : "",
        amortizationType: debt.amortizationType || "",
        startDate: debt.startDate ? new Date(debt.startDate).toISOString().split("T")[0] : "",
        nextDueDate: debt.nextDueDate ? new Date(debt.nextDueDate).toISOString().split("T")[0] : "",
        accountId: debt.account?.id || "",
        categoryId: debt.category?.id || "",
        creditor: debt.creditor || "",
        allowsPrepayment: debt.allowsPrepayment ?? true,
      });
      setShowOtherCategory(false);
      setCustomCategory("");
      setShowOtherAccount(false);
      setCustomAccount("");
    }
  }, [debt, isOpen]);

  const handleAccountChange = (value: string) => {
    if (value === "OTHER_ACCOUNT") {
      setShowOtherAccount(true);
      setForm(prev => ({ ...prev, accountId: "" }));
    } else {
      setShowOtherAccount(false);
      setForm(prev => ({ ...prev, accountId: value }));
      setCustomAccount("");
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "OTHER") {
      setShowOtherCategory(true);
      setForm(prev => ({ ...prev, categoryId: "" }));
    } else {
      setShowOtherCategory(false);
      setForm(prev => ({ ...prev, categoryId: value }));
      setCustomCategory("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt?.id) return;
    
    setLoading(true);
    setError("");

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

      // Criar nova categoria se necessário
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

      if (!finalCategoryId) throw new Error("Selecione ou crie uma categoria");
      if (!finalAccountId) throw new Error("Selecione ou crie uma conta");

      const res = await fetch(`/api/dividas/${debt.id}`, {
        method: "PATCH",
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
          interestRate: form.interestRate ? parseFloat(form.interestRate) : null,
          amortizationType: form.amortizationType || null,
        }),
      });

      // ✅ Robustez: Verificar se a resposta tem conteúdo antes de tentar dar parse
      const contentType = res.headers.get("content-type");
      let data = null;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        throw new Error(data?.error || "Erro ao atualizar dívida");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar dívida");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm h-11 placeholder:text-slate-600 font-medium";
  const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Dívida"
      subtitle="Atualize as condições do seu parcelamento"
      icon={<DollarSign className="w-6 h-6 text-white" />}
      theme="red"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Nome da Dívida *</label>
              <input
                className={inputClass}
                placeholder="Ex: Financiamento Carro"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Credor</label>
              <input
                className={inputClass}
                placeholder="Ex: Banco Itaú"
                value={form.creditor}
                onChange={(e) => setForm({ ...form, creditor: e.target.value })}
              />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Valor Total (R$) *</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                required
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Valor Parcela (R$) *</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                required
                value={form.installmentValue}
                onChange={(e) => setForm({ ...form, installmentValue: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Total de Parcelas *</label>
              <input
                type="number"
                className={inputClass}
                required
                value={form.installmentTotal}
                onChange={(e) => setForm({ ...form, installmentTotal: e.target.value })}
              />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
               <div>
                  <label className={labelClass}>Conta de Origem *</label>
                  <div className="relative">
                    <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      className={`${inputClass} pl-10`}
                      required
                      value={showOtherAccount ? "OTHER_ACCOUNT" : form.accountId}
                      onChange={(e) => handleAccountChange(e.target.value)}
                    >
                      <option value="">Selecione uma conta</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                      <option value="OTHER_ACCOUNT">➕ Outra Conta...</option>
                    </select>

                    {showOtherAccount && (
                        <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                          <input
                            type="text"
                            value={customAccount}
                            onChange={(e) => setCustomAccount(e.target.value)}
                            placeholder="Nome da nova conta"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-sm"
                            autoFocus
                            required
                          />
                        </div>
                    )}
                  </div>
               </div>
               <div>
                  <label className={labelClass}>Categoria *</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      className={`${inputClass} pl-10`}
                      required
                      value={showOtherCategory ? "OTHER" : form.categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="OTHER">➕ Outra...</option>
                    </select>

                    {showOtherCategory && (
                        <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                          <input
                            type="text"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            placeholder="Nome da nova categoria"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-sm"
                            autoFocus
                            required
                          />
                        </div>
                    )}
                  </div>
               </div>
            </div>

            <div className="space-y-4">
                <div>
                   <label className={labelClass}>Início do Pagamento</label>
                   <div className="relative">
                     <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                     <input
                       type="date"
                       className={`${inputClass} pl-10`}
                       value={form.startDate}
                       onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                     />
                   </div>
                </div>
                <div>
                   <label className={labelClass}>Próximo Vencimento</label>
                   <div className="relative">
                     <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                     <input
                       type="date"
                       className={`${inputClass} pl-10`}
                       value={form.nextDueDate}
                       onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
                     />
                   </div>
                </div>
            </div>
        </div>

        <div className="flex gap-4 pt-4 sticky bottom-0 bg-slate-900/80 backdrop-blur-sm -mx-2 px-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-2xl transition-all border border-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-2xl shadow-lg shadow-red-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <NeuralLoading message="Sincronizando..." variant="inline" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </AnimatedModal>
  );
}
