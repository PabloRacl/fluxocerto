"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { Bell, Plus, Trash2, Check, RefreshCw, Eye, X } from "lucide-react";

const TIPO_LABELS: Record<string, string> = {
  VENCIMENTO_DIVIDA: "Vencimento de Dívida",
  ALERTA_ORCAMENTO: "Alerta de Orçamento",
  RENOVACAO_ASSINATURA: "Renovação de Assinatura",
  PROGRESSO_META: "Progresso de Meta",
  VENCIMENTO_TRANSACAO: "Vencimento de Transação",
  ALERTA_LIMITE_CARTAO: "Limite de Cartão",
  GERAL: "Geral",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LembretesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [lembretes, setLembretes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRead, setShowRead] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    mensagem: "",
    tipo: "GERAL",
    notificarEm: "",
  });

  const fetchLembretes = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lembretes?showRead=${showRead}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLembretes(data.lembretes || []);
    } catch {
      console.error("Erro");
    } finally {
      setLoading(false);
    }
  }, [status, showRead]);

  useEffect(() => {
    if (status === "authenticated") fetchLembretes();
  }, [status, fetchLembretes]);
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

  const marcarLido = async (id: string) => {
    try {
      await fetch(`/api/lembretes/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lido: true }),
      });
      fetchLembretes();
    } catch {
      console.error("Erro");
    }
  };

  const excluir = async (id: string) => {
    try {
      await fetch(`/api/lembretes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchLembretes();
    } catch {
      console.error("Erro");
    }
  };

  const criar = async () => {
    if (!form.titulo.trim() || !form.notificarEm) return;
    try {
      const res = await fetch("/api/lembretes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ titulo: "", mensagem: "", tipo: "GERAL", notificarEm: "" });
        fetchLembretes();
      }
    } catch {
      console.error("Erro");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title="Lembretes"
        subtitle="Gerencie seus lembretes financeiros"
        onRefresh={fetchLembretes}
      />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowRead(!showRead)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <Eye className="w-4 h-4" />{" "}
            {showRead ? "Ocultar lidos" : "Mostrar lidos"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" /> Novo Lembrete
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : lembretes.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800">
            <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum lembrete</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lembretes.map((l) => (
              <div
                key={l.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${l.lido ? "bg-slate-900/30 border-slate-800/50" : "bg-slate-900/50 border-slate-700"}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-medium ${l.lido ? "text-slate-500" : "text-white"}`}
                    >
                      {l.titulo}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                      {TIPO_LABELS[l.tipo] || l.tipo}
                    </span>
                  </div>
                  {l.mensagem && (
                    <p className="text-sm text-slate-400 mt-1">{l.mensagem}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Notificar em: {formatDate(l.notificarEm)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!l.lido && (
                    <button
                      onClick={() => marcarLido(l.id)}
                      className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg"
                      title="Marcar como lido"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => excluir(l.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Novo Lembrete</h3>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Título"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                <textarea
                  value={form.mensagem}
                  onChange={(e) =>
                    setForm({ ...form, mensagem: e.target.value })
                  }
                  placeholder="Mensagem (opcional)"
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                />
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {Object.entries(TIPO_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Data para notificar
                  </label>
                  <input
                    type="date"
                    value={form.notificarEm}
                    onChange={(e) =>
                      setForm({ ...form, notificarEm: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
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
                  onClick={criar}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
