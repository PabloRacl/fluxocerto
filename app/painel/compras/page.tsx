"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";
import { MascotAssistant } from "@/app/painel/_componentes/MascotAssistant";
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
  FileText,
  Maximize2,
  Zap,
} from "lucide-react";
import { ScannerQRCode } from "@/app/painel/_componentes/ScannerQRCode";
import { motion, AnimatePresence } from "framer-motion";

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
        description="Mercado, feira e lista de compras"
        breadcrumbs={[ { label: "Compras" } ]}
      >
      </PageHeader>

      {/* Abas */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-slate-950/60 backdrop-blur-2xl rounded-2xl p-1.5 border border-white/5">
          {[
            { id: "compras" as Tab, label: "Compras", icon: ShoppingBag },
            { id: "listas" as Tab, label: "Listas", icon: List },
            { id: "estoque" as Tab, label: "Estoque", icon: Package },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${tab === id ? "bg-emerald-600/90 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
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

      {/* Assistente Neural — Mestre Sábio */}
      <MascotAssistant />
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
  const [showImportModal, setShowImportModal] = useState(false);

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
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-slate-900/40 backdrop-blur-md rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setShowDeleted(false)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!showDeleted ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"}`}
          >
            ATIVAS
          </button>
          <button
            onClick={() => setShowDeleted(true)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${showDeleted ? "bg-red-600 text-white shadow-lg shadow-red-500/20" : "text-slate-400 hover:text-white"}`}
          >
            LIXEIRA
          </button>
        </div>
        {!showDeleted && (
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/10 transition-all border border-white/10"
            >
              <Plus className="w-5 h-5" /> Nova Compra
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/60 backdrop-blur-md hover:bg-slate-800/80 text-blue-400 rounded-xl text-sm font-bold shadow-lg transition-all border border-blue-500/30"
            >
              <Maximize2 className="w-4 h-4" /> Scan Neural
            </motion.button>
          </div>
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

      {showImportModal && (
        <ImportarNFModal
          onClose={() => setShowImportModal(false)}
          onSuccess={async (compraData) => {
            setShowImportModal(false);
            // Criar a compra diretamente
            try {
              const res = await fetch("/api/compras", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  ...compraData,
                  paymentMethod: "PIX", // padrão
                  gerarTransacao: true,
                }),
              });
              if (res.ok) {
                alert("Compra importada com sucesso!");
                fetchCompras();
              } else {
                const error = await res.json();
                alert(`Erro: ${error.error}`);
              }
            } catch (error) {
              alert("Erro ao criar compra");
            }
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
  const [showImportModal, setShowImportModal] = useState(false);

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
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nova Lista
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
          >
            <FileText className="w-4 h-4" /> Importar NF
          </button>
        </div>
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

      {showImportModal && (
        <ImportarNFModal
          onClose={() => setShowImportModal(false)}
          onSuccess={async (compraData) => {
            setShowImportModal(false);
            // Para listas, talvez criar uma nova lista com os itens
            try {
              // Criar lista com nome baseado na NF
              const listaNome = `Lista NF - ${compraData.storeName || 'Importada'}`;
              const listaRes = await fetch("/api/listas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ nome: listaNome }),
              });

              if (listaRes.ok) {
                const listaData = await listaRes.json();
                // Adicionar itens à lista
                for (const item of compraData.items || []) {
                  await fetch(`/api/listas/${listaData.id}/itens`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      nome: item.name,
                      quantidade: item.quantity,
                    }),
                  });
                }
                alert("Lista criada com sucesso!");
                fetchListas();
              } else {
                alert("Erro ao criar lista");
              }
            } catch (error) {
              alert("Erro ao importar NF para lista");
            }
          }}
        />
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

  const handleCategoryChange = (val: string) => {
    if (val === "OTHER") {
      setShowOtherCategory(true);
      setForm({ ...form, categoryId: "" });
    } else {
      setShowOtherCategory(false);
      setForm({ ...form, categoryId: val });
    }
  };

  const handleAccountChange = (val: string) => {
    if (val === "OTHER") {
      setShowOtherAccount(true);
      setForm({ ...form, accountId: "" });
    } else {
      setShowOtherAccount(false);
      setForm({ ...form, accountId: val });
    }
  };

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
      let finalCategoryId = form.categoryId;
      let finalAccountId = form.accountId;

      // Criar Categoria on-the-fly
      if (showOtherCategory && customCategory.trim()) {
        const catRes = await fetch("/api/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: customCategory,
            type: "EXPENSE",
            color: "#10B981", // Default Emerald
          }),
        });
        if (catRes.ok) {
          const catData = await catRes.json();
          finalCategoryId = catData.id;
        }
      }

      // Criar Conta on-the-fly
      if (showOtherAccount && customAccount.trim()) {
         const accRes = await fetch("/api/contas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
               name: customAccount,
               balance: 0,
               type: "CHECKING",
               color: "#3B82F6", // Default Blue
               icon: "🏦"
            })
         });
         if (accRes.ok) {
            const accData = await accRes.json();
            finalAccountId = accData.id;
         }
      }

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
          categoryId: finalCategoryId || null,
          accountId: finalAccountId || null,
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
    <AnimatedModal
      isOpen={true}
      onClose={onClose}
      title="Nova Compra"
      subtitle="Registre uma compra com ou sem itens detalhados"
      icon={<ShoppingBag className="w-6 h-6 text-white" />}
      theme="emerald"
      maxWidth="2xl"
    >
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
                value={showOtherAccount ? "OTHER" : form.accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
              >
                <option value="">Selecione</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
                <option value="OTHER">➕ Outra...</option>
              </select>
              {showOtherAccount && (
                <input
                  className={`${inputClass} mt-2 border-blue-500/50`}
                  placeholder="Nome da Nova Conta"
                  autoFocus
                  value={customAccount}
                  onChange={(e) => setCustomAccount(e.target.value)}
                />
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Categoria
              </label>
              <select
                className={inputClass}
                value={showOtherCategory ? "OTHER" : form.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Selecione</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="OTHER">➕ Outra...</option>
              </select>
              {showOtherCategory && (
                <input
                  className={`${inputClass} mt-2 border-emerald-500/50`}
                  placeholder="Nome da Nova Categoria"
                  autoFocus
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
              )}
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
    </AnimatedModal>
  );
}

// ============================================
// MODAL IMPORTAR NF
// ============================================
function ImportarNFModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (data: any) => void;
}) {
  const [modo, setModo] = useState<"pdf" | "numero" | "qr">("pdf");
  const [numeroNF, setNumeroNF] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/categorias?type=EXPENSE", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []));

    fetch("/api/contas", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAccounts(Array.isArray(d) ? d : d.accounts || []));
  }, []);

  const updateParsedItem = (index: number, field: "categoryId" | "accountId", value: string) => {
    setParsedData((prev: any) => {
      if (!prev) return prev;
      const nextItems = [...prev.items];
      nextItems[index] = {
        ...nextItems[index],
        [field]: value || null,
      };
      // automatic label fill for category name
      if (field === "categoryId") {
        const category = categories.find((c) => c.id === value);
        nextItems[index].category = category ? category.name : nextItems[index].category;
      }
      return { ...prev, items: nextItems };
    });
  };

  const handleExtract = async () => {
    setError(null);
    setLoading(true);
    try {
      let dadosExtraidos: any = {};

      if (modo === "numero") {
        const chaveTrim = String(numeroNF).replace(/\D/g, "");
        if (chaveTrim.length !== 44) {
          setError("Chave NFC-e inválida. Informe os 44 números da chave.");
          setParsedData(null);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/compras/importar-nfce?chave=${encodeURIComponent(chaveTrim)}`, {
          credentials: "include",
        });

        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const json = await res.json();
            if (json.error) {
              throw new Error(json.error + (json.details ? `: ${json.details}` : ""));
            }
            dadosExtraidos = json;
          } else {
            throw new Error("Resposta inesperada do servidor (não JSON)");
          }
        } else {
          const body = await res.json().catch(() => ({}));
          const errorMessage =
            (body.error ? body.error : "Erro ao buscar NFC-e por chave") +
            (body.details ? `: ${body.details}` : "");
          throw new Error(`HTTP ${res.status}: ${errorMessage}`);
        }
      } else if (modo === "pdf" && pdfFile) {
        const formData = new FormData();
        formData.append("pdf", pdfFile);

        const res = await fetch("/api/compras/importar-pdf", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (res.ok) {
          dadosExtraidos = await res.json();
        } else {
          setError("Erro ao processar PDF");
          setLoading(false);
          return;
        }
      }

      if (!dadosExtraidos || !dadosExtraidos.items) {
        setError("Não foi possível extrair itens da NF. Verifique o formato do PDF.");
        setParsedData(null);
      } else {
        setParsedData({
          ...dadosExtraidos,
          items: dadosExtraidos.items.map((item: any) => ({
            ...item,
            categoryId: item.mappedCategoryId || "",
            accountId: item.mappedAccountId || "",
            category: item.category || "",
          })),
        });
      }
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Erro ao importar NF-e: ${detail}`);
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const saveMapping = async () => {
    if (!parsedData?.items?.length) return;
    const mappings = parsedData.items
      .filter((item: any) => item.categoryId || item.accountId)
      .map((item: any) => ({
        name: item.name,
        categoryId: item.categoryId || null,
        accountId: item.accountId || null,
      }));

    if (mappings.length === 0) {
      alert("Nenhum mapeamento fornecido para salvar.");
      return;
    }

    try {
      const res = await fetch("/api/compras/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mappings }),
      });
      if (res.ok) {
        alert("Mapeamento salvo com sucesso.");
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar mapeamento.");
      }
    } catch {
      alert("Erro ao salvar mapeamento.");
    }
  };

  const handleConfirm = async () => {
    if (!parsedData) {
      setError("Faça a extração antes de confirmar a importação.");
      return;
    }

    const categoryIdCandidates = parsedData.items
      .map((item: any) => item.categoryId)
      .filter(Boolean);
    const accountIdCandidates = parsedData.items
      .map((item: any) => item.accountId)
      .filter(Boolean);

    const mostCommon = (arr: string[]) =>
      arr
        .reduce((acc: any, value) => {
          acc[value] = (acc[value] || 0) + 1;
          return acc;
        }, {})
        ;

    const findTop = (arr: string[]) => {
      const freq = mostCommon(arr);
      const sorted = (Object.entries(freq) as [string, number][]).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0 ? sorted[0][0] : null;
    };

    const inferredCategoryId = findTop(categoryIdCandidates);
    const inferredAccountId = findTop(accountIdCandidates);

    const itemMappings = parsedData.items.map((item: any) => ({
      name: item.name,
      categoryId: item.categoryId || null,
      accountId: item.accountId || null,
    }));

    const payload = {
      description: parsedData.description,
      storeName: parsedData.storeName,
      purchaseDate: parsedData.purchaseDate,
      totalAmount: parsedData.totalAmount,
      items: parsedData.items.map((item: any) => {
        const categoryName =
          item.categoryId && categories.find((c) => c.id === item.categoryId)
            ? categories.find((c) => c.id === item.categoryId)?.name
            : item.category || null;
        return {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          barcode: item.barcode,
          category: categoryName || null,
          categoryId: item.categoryId || null,
          accountId: item.accountId || null,
        };
      }),
      categoryId: inferredCategoryId || null,
      accountId: inferredAccountId || null,
      itemMappings,
    };

    onSuccess(payload);
  };

  return (
    <AnimatedModal
      isOpen={true}
      onClose={onClose}
      title="Importar Nota Fiscal"
      subtitle="Selecione o método de importação"
      icon={<FileText className="w-6 h-6 text-white" />}
      theme="blue"
      maxWidth="md"
    >
      <div className="p-6 space-y-4">
        <div className="flex gap-2 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[1.25rem] p-1.5 shadow-inner">
          <button
            onClick={() => setModo("pdf")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${modo === "pdf" ? "bg-blue-600/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            <FileText className="w-4 h-4" /> UPLOAD PDF
          </button>
          <button
            onClick={() => setModo("numero")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${modo === "numero" ? "bg-blue-600/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            <Zap className="w-4 h-4" /> CHAVE NF
          </button>
          <button
            onClick={() => {
              setModo("qr");
              setIsScannerOpen(true);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${modo === "qr" ? "bg-emerald-600/90 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            <Maximize2 className="w-4 h-4" /> SCANNER
          </button>
        </div>

        {modo === "pdf" && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Selecione o arquivo PDF da Nota Fiscal
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500"
            />
          </div>
        )}

        {modo === "numero" && (
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
              Chave de Acesso (44 dígitos)
            </label>
            <div className="relative group">
              <input
                type="text"
                value={numeroNF}
                onChange={(e) => setNumeroNF(e.target.value)}
                placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                className="w-full px-5 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm tracking-widest group-hover:bg-slate-900/80"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}

        {modo === "qr" && (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900/30 rounded-[2rem] border border-white/5 border-dashed gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Maximize2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-center">
              <h4 className="text-white font-bold">Scanner Biométrico</h4>
              <p className="text-sm text-slate-400">Capture o QR Code da nota fiscal com sua câmera</p>
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="mt-2 px-6 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/5"
            >
              ATIVAR CÂMERA
            </button>
          </div>
        )}

        <ScannerQRCode
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(text) => {
            const match = text.match(/[0-9]{44}/);
            if (match) {
              setNumeroNF(match[0]);
              setModo("numero");
              setIsScannerOpen(false);
              // Auto extrair após scan
              setTimeout(() => {
                const btn = document.getElementById("btn-extrair-nf");
                if (btn) btn.click();
              }, 100);
            } else {
              setError("QR Code não contém uma chave de acesso válida.");
              setIsScannerOpen(false);
            }
          }}
          onScanError={(err) => console.error("Scan error:", err)}
        />

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded">
            {error}
          </p>
        )}

        {parsedData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative border border-white/5 rounded-[2rem] p-5 bg-slate-900/40 backdrop-blur-3xl overflow-hidden group shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Package className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-widest bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  Inteligência de Dados ({parsedData.items.length})
                </h4>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                AI ACTIVE
              </div>
            </div>

            {parsedData.items.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-8 text-center">Nenhum dado neural detectado.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar pb-2">
                {parsedData.items.map((item: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all group/item"
                  >
                    <div>
                      <div className="text-slate-200 text-sm font-bold truncate group-hover/item:text-white transition-colors">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium text-slate-500">
                          {item.quantity} {item.unit || 'un'}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-[10px] font-bold text-emerald-400/80">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={item.categoryId || ""}
                        onChange={(e) => updateParsedItem(idx, "categoryId", e.target.value)}
                        className="flex-1 bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all group-hover/item:border-blue-500/30"
                      >
                        <option value="">Categoria</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <select
                        value={item.accountId || ""}
                        onChange={(e) => updateParsedItem(idx, "accountId", e.target.value)}
                        className="flex-1 bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all group-hover/item:border-blue-500/30"
                      >
                        <option value="">Conta</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={saveMapping}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-xl transition-all uppercase tracking-widest"
              >
                <RefreshCw className="w-3 h-3" /> Fixar Mapeamentos
              </button>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Neural:</span>
                <span className="text-lg font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((parsedData.totalAmount || 0) / 100)}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            Cancelar
          </button>
          <button
            id="btn-extrair-nf"
            onClick={parsedData ? handleConfirm : handleExtract}
            disabled={loading || (modo === "pdf" && !pdfFile) || (modo === "numero" && !numeroNF) || (modo === "qr" && !numeroNF)}
            className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all border border-white/10"
          >
            {loading ? (parsedData ? "PROCESSANDO..." : "EXTRAINDO...") : parsedData ? "CONFIRMAR IMPORTAÇÃO" : "EXTRAIR ITENS"}
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
}
