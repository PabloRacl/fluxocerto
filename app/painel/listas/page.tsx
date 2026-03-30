"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";
import { ShoppingCart, Plus, Trash2, Check, X, RefreshCw } from "lucide-react";

interface ListaItem {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  comprado: boolean;
  precoMaximo: number | null;
  observacao: string | null;
}

interface Lista {
  id: string;
  nome: string;
  concluida: boolean;
  criadoEm: string;
  itens: ListaItem[];
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v / 100);
}

export default function ListasComprasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [listas, setListas] = useState<Lista[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newItemNome, setNewItemNome] = useState("");
  const [newItemQtd, setNewItemQtd] = useState("1");
  const [addingToList, setAddingToList] = useState<string | null>(null);

  const fetchListas = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch("/api/listas", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setListas(data.listas || []);
    } catch {
      console.error("Erro");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") fetchListas();
  }, [status, fetchListas]);
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

  const criarLista = async () => {
    if (!newNome.trim()) return;
    try {
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
    } catch {
      console.error("Erro");
    }
  };

  const addItem = async (listaId: string) => {
    if (!newItemNome.trim()) return;
    try {
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
    } catch {
      console.error("Erro");
    }
  };

  const toggleItem = async (
    listaId: string,
    itemId: string,
    comprado: boolean,
  ) => {
    try {
      await fetch(`/api/listas/${listaId}/itens`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, comprado: !comprado }),
      });
      fetchListas();
    } catch {
      console.error("Erro");
    }
  };

  const removeItem = async (listaId: string, itemId: string) => {
    try {
      await fetch(`/api/listas/${listaId}/itens?itemId=${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchListas();
    } catch {
      console.error("Erro");
    }
  };

  const concluirLista = async (listaId: string) => {
    try {
      await fetch(`/api/listas/${listaId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluida: true }),
      });
      fetchListas();
    } catch {
      console.error("Erro");
    }
  };

  const excluirLista = async (listaId: string) => {
    if (!confirm("Excluir esta lista?")) return;
    try {
      await fetch(`/api/listas/${listaId}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchListas();
    } catch {
      console.error("Erro");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title="Listas de Compras"
        subtitle="Organize suas compras"
        onRefresh={fetchListas}
      />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" /> Nova Lista
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : listas.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800">
            <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhuma lista criada</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                        className={`font-medium ${lista.concluida ? "text-emerald-400 line-through" : "text-white"}`}
                      >
                        {lista.nome}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {lista.itens.length} itens •{" "}
                        {lista.itens.filter((i) => i.comprado).length} comprados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!lista.concluida && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          concluirLista(lista.id);
                        }}
                        className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg"
                        title="Concluir"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        excluirLista(lista.id);
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedId === lista.id && (
                  <div className="border-t border-slate-800 p-4">
                    {lista.itens.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">
                        Nenhum item na lista
                      </p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {lista.itens.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-lg ${item.comprado ? "bg-emerald-500/10" : "bg-slate-800/50"}`}
                          >
                            <div className="flex items-center gap-3">
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
                                className={
                                  item.comprado
                                    ? "text-slate-400 line-through"
                                    : "text-white"
                                }
                              >
                                {item.nome} ({item.quantidade} {item.unidade})
                              </span>
                              {item.precoMaximo && (
                                <span className="text-xs text-amber-400">
                                  Max: {formatCurrency(item.precoMaximo)}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(lista.id, item.id)}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                            >
                              <X className="w-4 h-4" />
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
                          placeholder="Nome do item"
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                        />
                        <input
                          type="number"
                          value={newItemQtd}
                          onChange={(e) => setNewItemQtd(e.target.value)}
                          placeholder="Qtd"
                          className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
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
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      !lista.concluida && (
                        <button
                          onClick={() => setAddingToList(lista.id)}
                          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
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
          <AnimatedModal
            isOpen={showNewModal}
            onClose={() => setShowNewModal(false)}
            title="Nova Lista de Compras"
            icon={<ShoppingCart className="w-6 h-6 text-white" />}
            theme="emerald"
            maxWidth="md"
          >
              <div className="p-6">
              <input
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                placeholder="Nome da lista (ex: Feira do sábado)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4"
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
          </AnimatedModal>
        )}
      </main>
    </div>
  );
}
