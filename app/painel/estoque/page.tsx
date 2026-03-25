"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  RefreshCw,
  X,
} from "lucide-react";

interface EstoqueItem {
  id: string;
  nome: string;
  categoria: string | null;
  quantidade: number;
  unidade: string;
  precoMedio: number;
  precoUltimo: number;
  validade: string | null;
  estoqueMinimo: number;
  ativo: boolean;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v / 100);
}

export default function EstoquePage() {
  const { status } = useSession();
  const router = useRouter();
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<EstoqueItem | null>(null);
  const [form, setForm] = useState({
    nome: "",
    categoria: "",
    quantidade: "0",
    unidade: "un",
    precoMedio: "",
    precoUltimo: "",
    validade: "",
    estoqueMinimo: "1",
  });

  const fetchEstoque = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch("/api/estoque", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEstoque(data.estoque || []);
      setResumo(data.resumo);
    } catch {
      console.error("Erro");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") fetchEstoque();
  }, [status, fetchEstoque]);
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

  const openNew = () => {
    setEditItem(null);
    setForm({
      nome: "",
      categoria: "",
      quantidade: "0",
      unidade: "un",
      precoMedio: "",
      precoUltimo: "",
      validade: "",
      estoqueMinimo: "1",
    });
    setShowModal(true);
  };
  const openEdit = (item: EstoqueItem) => {
    setEditItem(item);
    setForm({
      nome: item.nome,
      categoria: item.categoria || "",
      quantidade: String(item.quantidade),
      unidade: item.unidade,
      precoMedio: item.precoMedio ? String(item.precoMedio / 100) : "",
      precoUltimo: item.precoUltimo ? String(item.precoUltimo / 100) : "",
      validade: item.validade ? item.validade.split("T")[0] : "",
      estoqueMinimo: String(item.estoqueMinimo),
    });
    setShowModal(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) return;
    const body = {
      nome: form.nome,
      categoria: form.categoria || null,
      quantidade: parseFloat(form.quantidade) || 0,
      unidade: form.unidade,
      precoMedio: parseFloat(form.precoMedio) || 0,
      precoUltimo: parseFloat(form.precoUltimo) || 0,
      validade: form.validade || null,
      estoqueMinimo: parseFloat(form.estoqueMinimo) || 1,
    };
    try {
      const url = editItem ? `/api/estoque/${editItem.id}` : "/api/estoque";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        fetchEstoque();
      }
    } catch {
      console.error("Erro");
    }
  };

  const remover = async (id: string) => {
    if (!confirm("Desativar este item?")) return;
    try {
      await fetch(`/api/estoque/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchEstoque();
    } catch {
      console.error("Erro");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title="Controle de Estoque"
        subtitle="Gerencie itens do seu estoque"
        onRefresh={fetchEstoque}
      />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {resumo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <p className="text-xs text-slate-400">Itens</p>
              <p className="text-xl font-bold text-white">
                {resumo.totalItens}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <p className="text-xs text-slate-400">Valor Total</p>
              <p className="text-xl font-bold text-emerald-400">
                {formatCurrency(resumo.valorTotal)}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <p className="text-xs text-slate-400">Estoque Baixo</p>
              <p className="text-xl font-bold text-amber-400">
                {resumo.alertasEstoque}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <p className="text-xs text-slate-400">Validade Próxima</p>
              <p className="text-xl font-bold text-red-400">
                {resumo.alertasValidade}
              </p>
            </div>
          </div>
        )}
        <div className="flex justify-end mb-6">
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" /> Novo Item
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : estoque.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum item no estoque</p>
          </div>
        ) : (
          <div className="space-y-2">
            {estoque.map((item) => {
              const baixo =
                Number(item.quantidade) <= Number(item.estoqueMinimo);
              const validadeProxima =
                item.validade &&
                Math.ceil(
                  (new Date(item.validade).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                ) <= 7;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border ${baixo ? "border-amber-500/30" : "border-slate-800"}`}
                >
                  <div className="flex items-center gap-4">
                    {baixo && (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                      <h3 className="font-medium text-white">{item.nome}</h3>
                      <p className="text-xs text-slate-400">
                        {item.categoria && `${item.categoria} • `}
                        {item.quantidade} {item.unidade}
                        {item.precoMedio > 0 &&
                          ` • ${formatCurrency(item.precoMedio)}/un`}
                        {validadeProxima && (
                          <span className="text-red-400 ml-2">
                            ⚠ Validade próxima
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remover(item.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl p-6 w-full max-w-lg border border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">
                  {editItem ? "Editar Item" : "Novo Item"}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome do item"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                <input
                  value={form.categoria}
                  onChange={(e) =>
                    setForm({ ...form, categoria: e.target.value })
                  }
                  placeholder="Categoria (opcional)"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={form.quantidade}
                    onChange={(e) =>
                      setForm({ ...form, quantidade: e.target.value })
                    }
                    placeholder="Quantidade"
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    value={form.unidade}
                    onChange={(e) =>
                      setForm({ ...form, unidade: e.target.value })
                    }
                    placeholder="Unidade (kg, un...)"
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={form.precoMedio}
                    onChange={(e) =>
                      setForm({ ...form, precoMedio: e.target.value })
                    }
                    placeholder="Preço médio (R$)"
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={form.precoUltimo}
                    onChange={(e) =>
                      setForm({ ...form, precoUltimo: e.target.value })
                    }
                    placeholder="Último preço (R$)"
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                      Validade
                    </label>
                    <input
                      type="date"
                      value={form.validade}
                      onChange={(e) =>
                        setForm({ ...form, validade: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <input
                    type="number"
                    value={form.estoqueMinimo}
                    onChange={(e) =>
                      setForm({ ...form, estoqueMinimo: e.target.value })
                    }
                    placeholder="Estoque mínimo"
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
