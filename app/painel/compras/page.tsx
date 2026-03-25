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
  Archive,
  ArchiveRestore,
  Trash2,
  ShoppingBag,
  Store,
  CreditCard,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Package,
  Eye,
} from "lucide-react";

interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  totalPrice: number;
}

interface Purchase {
  id: string;
  description: string;
  totalAmount: number;
  purchaseDate: string;
  storeName: string | null;
  paymentMethod: string;
  isInstallment: boolean;
  installmentTotal: number | null;
  installmentValue: number | null;
  isDeleted: boolean;
  items: PurchaseItem[];
  category: { id: string; name: string; color: string } | null;
  account: { id: string; name: string; color: string } | null;
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v / 100);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("pt-BR");
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  OTHER: "Outro",
};

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-xl ${className}`} />
  );
}

export default function ComprasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [compras, setCompras] = useState<Purchase[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchCompras = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("showDeleted", showDeleted.toString());
      const res = await fetch(`/api/compras?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompras(data.compras || []);
      setResumo(data.resumo || null);
      setError("");
    } catch {
      setError("Erro ao carregar compras");
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }
    if (status === "authenticated") fetchCompras();
  }, [status, router, fetchCompras]);

  const handleArchive = async (id: string) => {
    if (!confirm("Enviar compra para lixeira?")) return;
    try {
      const res = await fetch(`/api/compras/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchCompras();
      else alert("Erro");
    } catch {
      alert("Erro");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/compras/${id}/exclusao-permanente`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) fetchCompras();
      else alert("Erro");
    } catch {
      alert("Erro");
    }
  };

  const handleDeletePermanent = async (id: string) => {
    if (!confirm("⚠️ Exclusão PERMANENTE. Não pode ser desfeita!")) return;
    try {
      const res = await fetch(`/api/compras/${id}/exclusao-permanente`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchCompras();
      else alert("Erro");
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
          title="Compras"
          subtitle="Registre e acompanhe todas as suas compras"
          onRefresh={fetchCompras}
          onNew={() => setShowNewModal(true)}
          newButtonText="Nova Compra"
          showFilters
          filters={
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setShowDeleted(false)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${!showDeleted ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <ShoppingBag className="w-3 h-3" />
                Ativas
              </button>
              <button
                onClick={() => setShowDeleted(true)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${showDeleted ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Archive className="w-3 h-3" />
                Lixeira
              </button>
            </div>
          }
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Cards de Resumo */}
          {resumo && !showDeleted && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900/50 backdrop-blur-md rounded-xl border border-orange-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Total do Período
                  </span>
                </div>
                <p className="text-2xl font-bold text-orange-400">
                  {formatCurrency(resumo.totalMes)}
                </p>
              </div>
              <div className="p-5 bg-slate-900/50 backdrop-blur-md rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-400">Ticket Médio</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(resumo.ticketMedio)}
                </p>
              </div>
              <div className="p-5 bg-slate-900/50 backdrop-blur-md rounded-xl border border-red-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Store className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-sm text-slate-400">Maior Compra</span>
                </div>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(resumo.maiorCompra)}
                </p>
              </div>
              <div className="p-5 bg-slate-900/50 backdrop-blur-md rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Total de Compras
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {resumo.totalCompras}
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          )}

          {!loading && !error && compras.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <ShoppingBag className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {showDeleted ? "Lixeira vazia" : "Nenhuma compra registrada"}
              </h3>
              <p className="text-slate-400 text-center mb-4">
                {showDeleted
                  ? "Compras excluídas aparecerão aqui"
                  : "Registre suas compras para acompanhar gastos"}
              </p>
              {!showDeleted && (
                <button
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" /> Nova Compra
                </button>
              )}
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Lista de Compras */}
          {!loading && !error && compras.length > 0 && (
            <div className="space-y-3">
              {compras.map((compra) => {
                const expanded = expandedId === compra.id;
                return (
                  <div
                    key={compra.id}
                    className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 hover:border-slate-700 transition-all overflow-hidden"
                  >
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {compra.description}
                            </h3>
                            {compra.isInstallment && (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0">
                                {compra.installmentTotal}x
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            <span>{formatDate(compra.purchaseDate)}</span>
                            {compra.storeName && (
                              <span className="flex items-center gap-1">
                                <Store className="w-3 h-3" /> {compra.storeName}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
                              {PAYMENT_LABELS[compra.paymentMethod] ||
                                compra.paymentMethod}
                            </span>
                            {compra.category && (
                              <span className="flex items-center gap-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: compra.category.color,
                                  }}
                                />
                                {compra.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-lg font-bold text-white">
                          {formatCurrency(compra.totalAmount)}
                        </span>

                        {/* Expandir Itens */}
                        {compra.items.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedId(expanded ? null : compra.id)
                            }
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            {expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Ações */}
                        {showDeleted ? (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleRestore(compra.id)}
                                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
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
                                  onClick={() =>
                                    handleDeletePermanent(compra.id)
                                  }
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-red-400">
                                  Excluir Permanente
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleArchive(compra.id)}
                                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Enviar para Lixeira</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Itens Expandidos */}
                    {expanded && compra.items.length > 0 && (
                      <div className="border-t border-slate-800 bg-slate-950/30 px-5 py-3">
                        <p className="text-xs font-medium text-slate-400 mb-2">
                          Itens da Compra ({compra.items.length})
                        </p>
                        <div className="space-y-1">
                          {compra.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm py-1"
                            >
                              <div className="flex items-center gap-2">
                                <Package className="w-3 h-3 text-slate-500" />
                                <span className="text-slate-300">
                                  {item.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {Number(item.quantity)} {item.unit || "un"} ×{" "}
                                  {formatCurrency(item.unitPrice)}
                                </span>
                              </div>
                              <span className="text-slate-200 font-medium">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Modal Nova Compra */}
        {showNewModal && (
          <NovaCompraModal
            onClose={() => setShowNewModal(false)}
            onSuccess={() => {
              setShowNewModal(false);
              fetchCompras();
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// ============================================
// MODAL NOVA COMPRA
// ============================================
interface ItemForm {
  name: string;
  quantity: string;
  unitPrice: string;
  unit: string;
}

function NovaCompraModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<ItemForm[]>([]);

  const [form, setForm] = useState({
    description: "",
    totalAmount: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    storeName: "",
    paymentMethod: "PIX",
    accountId: "",
    categoryId: "",
    isInstallment: false,
    installmentTotal: "",
    installmentValue: "",
  });

  useEffect(() => {
    fetch("/api/contas", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAccounts(Array.isArray(d) ? d : d.accounts || []));
    fetch("/api/categorias?type=EXPENSE", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []));
  }, []);

  const addItem = () =>
    setItems([...items, { name: "", quantity: "1", unitPrice: "", unit: "" }]);
  const removeItem = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string) => {
    const newItems = [...items];
    (newItems[i] as any)[field] = val;
    setItems(newItems);
  };

  const totalItens = items.reduce((acc, it) => {
    return (
      acc + parseFloat(it.quantity || "0") * parseFloat(it.unitPrice || "0")
    );
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const totalAmount =
        items.length > 0
          ? Math.round(totalItens * 100)
          : Math.round(parseFloat(form.totalAmount) * 100);

      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          totalAmount,
          isInstallment: form.isInstallment,
          installmentTotal: form.isInstallment
            ? parseInt(form.installmentTotal)
            : null,
          installmentValue: form.isInstallment
            ? Math.round(parseFloat(form.installmentValue) * 100)
            : null,
          items: items
            .filter((it) => it.name && it.unitPrice)
            .map((it) => ({
              name: it.name,
              quantity: parseFloat(it.quantity),
              unitPrice: parseFloat(it.unitPrice),
              unit: it.unit || null,
            })),
        }),
      });

      if (res.ok) onSuccess();
      else {
        const d = await res.json();
        alert(d.error || "Erro");
      }
    } catch {
      alert("Erro ao criar compra");
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
          <h2 className="text-xl font-bold text-white">Nova Compra</h2>
          <p className="text-sm text-slate-400">
            Registre uma compra com ou sem itens detalhados
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Descrição *
              </label>
              <input
                className={inputClass}
                required
                placeholder="Ex: Compra no mercado"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Loja/Estabelecimento
              </label>
              <input
                className={inputClass}
                placeholder="Ex: Supermercado ABC"
                value={form.storeName}
                onChange={(e) =>
                  setForm({ ...form, storeName: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {items.length === 0 && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Valor Total (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  required
                  placeholder="150.00"
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm({ ...form, totalAmount: e.target.value })
                  }
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Data *
              </label>
              <input
                type="date"
                className={inputClass}
                required
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm({ ...form, purchaseDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Pagamento *
              </label>
              <select
                className={inputClass}
                required
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({ ...form, paymentMethod: e.target.value })
                }
              >
                <option value="PIX">PIX</option>
                <option value="CASH">Dinheiro</option>
                <option value="DEBIT_CARD">Débito</option>
                <option value="CREDIT_CARD">Crédito</option>
                <option value="BANK_TRANSFER">Transferência</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Conta</label>
              <select
                className={inputClass}
                value={form.accountId}
                onChange={(e) =>
                  setForm({ ...form, accountId: e.target.value })
                }
              >
                <option value="">Selecione</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Categoria
              </label>
              <select
                className={inputClass}
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                <option value="">Selecione</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Itens */}
          <div className="border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">
                📦 Itens da Compra
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 px-3 py-1 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" /> Adicionar Item
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">
                Compra simples (sem itens). Clique acima para detalhar.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      placeholder="Nome do item"
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                    />
                    <input
                      type="number"
                      className="w-16 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs text-center"
                      placeholder="Qtd"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(i, "quantity", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="w-24 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      placeholder="Preço un."
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(i, "unitPrice", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="text-right text-sm font-medium text-emerald-400 pt-2 border-t border-slate-700">
                  Total dos Itens:{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalItens)}
                </div>
              </div>
            )}
          </div>

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
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Registrar Compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
