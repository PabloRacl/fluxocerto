"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import {
  ShoppingBag,
  Store,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Plus,
  Package,
  Archive,
  ArchiveRestore,
  Trash2,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Edit2,
  ShoppingCart,
  Eye,
  List,
} from "lucide-react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v / 100);
}
function formatDate(d: string) {
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

type Tab = "compras" | "listas" | "estoque";

export default function ComprasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("compras");

  if (status === "loading")
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  if (status === "unauthenticated") {
    router.push("/entrar");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title="Compras"
        subtitle="Mercado, feira e lista de compras"
        onRefresh={() => {}}
      />

      {/* Abas */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
          {[
            { id: "compras" as Tab, label: "Compras", icon: ShoppingBag },
            { id: "listas" as Tab, label: "Listas", icon: List },
            { id: "estoque" as Tab, label: "Estoque", icon: Package },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === "compras" && <ComprasTab />}
        {tab === "listas" && <ListasTab />}
        {tab === "estoque" && <EstoqueTab />}
      </div>
    </div>
  );
}

// ============================================
// ABA COMPRAS
// ============================================
function ComprasTab() {
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchCompras = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/compras?showDeleted=${showDeleted}`, {
        credentials: "include",
      });
      if (res.ok) {
        const d = await res.json();
        setCompras(d.compras || []);
      }
    } catch {}
    setLoading(false);
  }, [showDeleted]);

  useEffect(() => {
    fetchCompras();
  }, [fetchCompras]);

  const handleArchive = async (id: string) => {
    if (!confirm("Enviar para lixeira?")) return;
    await fetch(`/api/compras/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchCompras();
  };

  const handleRestore = async (id: string) => {
    await fetch(`/api/compras/${id}/exclusao-permanente`, {
      method: "PATCH",
      credentials: "include",
    });
    fetchCompras();
  };

  const handleDeletePermanent = async (id: string) => {
    if (!confirm("Exclusão PERMANENTE?")) return;
    await fetch(`/api/compras/${id}/exclusao-permanente`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchCompras();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setShowDeleted(false)}
            className={`px-3 py-1 text-xs rounded-md ${!showDeleted ? "bg-emerald-600 text-white" : "text-slate-400"}`}
          >
            Ativas
          </button>
          <button
            onClick={() => setShowDeleted(true)}
            className={`px-3 py-1 text-xs rounded-md ${showDeleted ? "bg-red-600 text-white" : "text-slate-400"}`}
          >
            Lixeira
          </button>
        </div>
        {!showDeleted && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nova Compra
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : compras.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            {showDeleted ? "Lixeira vazia" : "Nenhuma compra registrada"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {compras.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden"
            >
              <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white truncate">
                        {c.description}
                      </h3>
                      {c.isInstallment && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-400">
                          {c.installmentTotal}x
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatDate(c.purchaseDate)}{" "}
                      {c.storeName && `• ${c.storeName}`} •{" "}
                      {PAYMENT_LABELS[c.paymentMethod] || c.paymentMethod}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(c.totalAmount)}
                  </span>
                  {c.items?.length > 0 &&
                    (expandedId === c.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ))}
                  {showDeleted ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(c.id);
                        }}
                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePermanent(c.id);
                        }}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(c.id);
                      }}
                      className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {expandedId === c.id && c.items?.length > 0 && (
                <div className="border-t border-slate-800 px-4 py-3 bg-slate-950/30">
                  <p className="text-xs text-slate-400 mb-2">
                    Itens ({c.items.length})
                  </p>
                  {c.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm py-1"
                    >
                      <span className="text-slate-300">
                        {item.name}{" "}
                        <span className="text-slate-500">
                          {Number(item.quantity)} {item.unit || "un"}
                        </span>
                      </span>
                      <span className="text-slate-200">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NovaCompraModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchCompras();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// ABA LISTAS
// ============================================
function ListasTab() {
  const [listas, setListas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [newItemNome, setNewItemNome] = useState("");
  const [newItemQtd, setNewItemQtd] = useState("1");

  const fetchListas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/listas", { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setListas(d.listas || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchListas();
  }, [fetchListas]);

  const criarLista = async () => {
    if (!newNome.trim()) return;
    const res = await fetch("/api/listas", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: newNome }),
    });
    if (res.ok) {
      setNewNome("");
      setShowNewModal(false);
      fetchListas();
    }
  };

  const addItem = async (listaId: string) => {
    if (!newItemNome.trim()) return;
    const res = await fetch(`/api/listas/${listaId}/itens`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: newItemNome,
        quantidade: parseFloat(newItemQtd) || 1,
      }),
    });
    if (res.ok) {
      setNewItemNome("");
      setNewItemQtd("1");
      setAddingToList(null);
      fetchListas();
    }
  };

  const toggleItem = async (
    listaId: string,
    itemId: string,
    comprado: boolean,
  ) => {
    await fetch(`/api/listas/${listaId}/itens`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, comprado: !comprado }),
    });
    fetchListas();
  };

  const removeItem = async (listaId: string, itemId: string) => {
    await fetch(`/api/listas/${listaId}/itens?itemId=${itemId}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchListas();
  };

  const concluirLista = async (id: string) => {
    await fetch(`/api/listas/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concluida: true }),
    });
    fetchListas();
  };

  const excluirLista = async (id: string) => {
    if (!confirm("Excluir esta lista?")) return;
    await fetch(`/api/listas/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchListas();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nova Lista
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : listas.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma lista criada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listas.map((lista) => (
            <div
              key={lista.id}
              className={`bg-slate-900/50 rounded-xl border ${lista.concluida ? "border-emerald-500/30" : "border-slate-800"}`}
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === lista.id ? null : lista.id)
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${lista.concluida ? "bg-emerald-500" : "bg-slate-600"}`}
                  />
                  <div>
                    <h3
                      className={`text-sm font-medium ${lista.concluida ? "text-emerald-400 line-through" : "text-white"}`}
                    >
                      {lista.nome}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lista.itens.length} itens •{" "}
                      {lista.itens.filter((i: any) => i.comprado).length}{" "}
                      comprados
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!lista.concluida && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        concluirLista(lista.id);
                      }}
                      className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirLista(lista.id);
                    }}
                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expandedId === lista.id && (
                <div className="border-t border-slate-800 p-4">
                  {lista.itens.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-3">
                      Nenhum item
                    </p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {lista.itens.map((item: any) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg ${item.comprado ? "bg-emerald-500/10" : "bg-slate-800/50"}`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                toggleItem(lista.id, item.id, item.comprado)
                              }
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${item.comprado ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}
                            >
                              {item.comprado && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </button>
                            <span
                              className={`text-sm ${item.comprado ? "text-slate-400 line-through" : "text-white"}`}
                            >
                              {item.nome} ({item.quantidade} {item.unidade})
                            </span>
                          </div>
                          <button
                            onClick={() => removeItem(lista.id, item.id)}
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {addingToList === lista.id ? (
                    <div className="flex gap-2">
                      <input
                        value={newItemNome}
                        onChange={(e) => setNewItemNome(e.target.value)}
                        placeholder="Item"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      />
                      <input
                        type="number"
                        value={newItemQtd}
                        onChange={(e) => setNewItemQtd(e.target.value)}
                        placeholder="Qtd"
                        className="w-16 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      />
                      <button
                        onClick={() => addItem(lista.id)}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingToList(null)}
                        className="px-3 py-2 bg-slate-700 text-white rounded-lg text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    !lista.concluida && (
                      <button
                        onClick={() => setAddingToList(lista.id)}
                        className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
                      >
                        <Plus className="w-4 h-4" /> Adicionar item
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">
              Nova Lista de Compras
            </h3>
            <input
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              placeholder="Nome da lista (ex: Feira do sábado)"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={criarLista}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// ABA ESTOQUE - COMPLETA COM CATÁLOGO, CONSUMO E CÂMERA
// ============================================
function EstoqueTab() {
  const [estoque, setEstoque] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [showConsumo, setShowConsumo] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [searchProduto, setSearchProduto] = useState("");
  const [produtos, setProdutos] = useState<any[]>([]);
  const [consumingQtd, setConsumingQtd] = useState("1");

  const fetchEstoque = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/estoque", { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setEstoque(d.estoque || []);
        setResumo(d.resumo);
      }
    } catch {}
    setLoading(false);
  }, []);

  const searchProdutos = useCallback(async (q: string) => {
    if (q.length < 2) {
      setProdutos([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/produtos?busca=${encodeURIComponent(q)}&limite=20`,
        { credentials: "include" },
      );
      if (res.ok) {
        const d = await res.json();
        setProdutos(d.produtos || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchEstoque();
  }, [fetchEstoque]);
  useEffect(() => {
    const t = setTimeout(() => searchProdutos(searchProduto), 300);
    return () => clearTimeout(t);
  }, [searchProduto, searchProdutos]);

  const addToEstoque = async (produto: any) => {
    try {
      const res = await fetch("/api/estoque/adicionar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId: produto.id, quantidade: 1 }),
      });
      if (res.ok) {
        setShowCatalogo(false);
        setSearchProduto("");
        fetchEstoque();
      }
    } catch {}
  };

  const consumir = async (item: any) => {
    const qtd = parseFloat(consumingQtd) || 1;
    try {
      const res = await fetch("/api/estoque/consumir", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estoqueId: item.id, quantidade: qtd }),
      });
      if (res.ok) {
        const d = await res.json();
        setShowConsumo(null);
        setConsumingQtd("1");
        fetchEstoque();
        if (d.alertaEstoqueBaixo)
          alert(`⚠ ${item.nome} está com estoque baixo!`);
      }
    } catch {}
  };

  const gerarListaAutomatica = async () => {
    try {
      const res = await fetch("/api/estoque/lista-automatica", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: "Reposição - " + new Date().toLocaleDateString("pt-BR"),
        }),
      });
      if (res.ok) {
        const d = await res.json();
        alert(d.message || "Lista criada!");
      }
    } catch {}
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setShowModal(true);
  };

  const salvarManual = async () => {
    if (!editItem) return;
    try {
      await fetch(`/api/estoque/${editItem.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantidade: editItem.quantidade,
          estoqueMinimo: editItem.estoqueMinimo,
        }),
      });
      setShowModal(false);
      setEditItem(null);
      fetchEstoque();
    } catch {}
  };

  const remover = async (id: string) => {
    if (!confirm("Desativar item?")) return;
    await fetch(`/api/estoque/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchEstoque();
  };

  return (
    <div>
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Itens</p>
            <p className="text-lg font-bold text-white">{resumo.totalItens}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Valor Estimado</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(resumo.valorTotal)}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Estoque Baixo</p>
            <p className="text-lg font-bold text-amber-400">
              {resumo.alertasEstoque}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Validade Próxima</p>
            <p className="text-lg font-bold text-red-400">
              {resumo.alertasValidade}
            </p>
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setShowCatalogo(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Adicionar do Catálogo
        </button>
        {resumo?.alertasEstoque > 0 && (
          <button
            onClick={gerarListaAutomatica}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium"
          >
            <ShoppingCart className="w-4 h-4" /> Gerar Lista de Compras (
            {resumo.alertasEstoque} itens)
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : estoque.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">Nenhum item no estoque</p>
          <button
            onClick={() => setShowCatalogo(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm"
          >
            Adicionar do Catálogo
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {estoque.map((item) => {
            const baixo = Number(item.quantidade) <= Number(item.estoqueMinimo);
            const validadeProxima =
              item.validade &&
              Math.ceil(
                (new Date(item.validade).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              ) <= 7;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border ${baixo ? "border-amber-500/30" : "border-slate-800"}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {baixo && (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                      {item.nome}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {item.categoria && `${item.categoria} • `}
                      <span
                        className={baixo ? "text-amber-400 font-medium" : ""}
                      >
                        {item.quantidade} {item.unidade}
                      </span>
                      {item.estoqueMinimo > 0 && (
                        <span className="text-slate-500">
                          {" "}
                          (mín: {item.estoqueMinimo})
                        </span>
                      )}
                      {item.precoMedio > 0 &&
                        ` • ${formatCurrency(item.precoMedio)}/un`}
                      {validadeProxima && (
                        <span className="text-red-400 ml-1">⚠ Validade</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Botão Consumir */}
                  <button
                    onClick={() => {
                      setShowConsumo(item);
                      setConsumingQtd("1");
                    }}
                    className="p-1.5 text-orange-400 hover:bg-orange-500/20 rounded"
                    title="Consumir"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 rounded"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remover(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Catálogo de Produtos */}
      {showCatalogo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-lg border border-slate-800 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                Catálogo de Produtos
              </h3>
              <button
                onClick={() => {
                  setShowCatalogo(false);
                  setSearchProduto("");
                }}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <input
              value={searchProduto}
              onChange={(e) => setSearchProduto(e.target.value)}
              placeholder="Buscar produto (ex: arroz, feijão...)"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white mb-3"
              autoFocus
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {searchProduto.length < 2 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  Digite pelo menos 2 caracteres para buscar
                </p>
              ) : produtos.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  Nenhum produto encontrado
                </p>
              ) : (
                produtos.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 cursor-pointer"
                    onClick={() => addToEstoque(p)}
                  >
                    <div>
                      <p className="text-sm text-white">{p.nome}</p>
                      <p className="text-xs text-slate-400">
                        {p.categoria} • {p.unidade} •{" "}
                        {formatCurrency(p.precoMedio)}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-emerald-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Consumo */}
      {showConsumo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-sm border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-2">
              Consumir: {showConsumo.nome}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Estoque atual: {showConsumo.quantidade} {showConsumo.unidade}
            </p>
            <input
              type="number"
              value={consumingQtd}
              onChange={(e) => setConsumingQtd(e.target.value)}
              placeholder="Quantidade a consumir"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConsumo(null);
                  setConsumingQtd("1");
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => consumir(showConsumo)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg"
              >
                Consumir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showModal && editItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-sm border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                Editar: {editItem.nome}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditItem(null);
                }}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={editItem.quantidade}
                  onChange={(e) =>
                    setEditItem({ ...editItem, quantidade: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Estoque Mínimo
                </label>
                <input
                  type="number"
                  value={editItem.estoqueMinimo}
                  onChange={(e) =>
                    setEditItem({ ...editItem, estoqueMinimo: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditItem(null);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={salvarManual}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MODAL NOVA COMPRA (mantido do original)
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
    const n = [...items];
    (n[i] as any)[field] = val;
    setItems(n);
  };
  const totalItens = items.reduce(
    (a, it) =>
      a + parseFloat(it.quantity || "0") * parseFloat(it.unitPrice || "0"),
    0,
  );

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
              <label className="block text-sm text-slate-400 mb-1">Loja</label>
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
                  Valor (R$) *
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
          <div className="border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">
                Itens da Compra
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 px-3 py-1 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg"
              >
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">
                Compra simples (sem itens)
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      placeholder="Nome"
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
                      placeholder="Preço"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(i, "unitPrice", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="p-1.5 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="text-right text-sm font-medium text-emerald-400 pt-2 border-t border-slate-700">
                  Total:{" "}
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
              className="px-6 py-2.5 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
