"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CabecalhoPagina } from "@/app/painel/_componentes/CabecalhoPagina";
import { CarregamentoNeural } from "@/app/painel/_componentes/CarregamentoNeural";
import { ModalAnimado } from "@/app/painel/_componentes/ModalAnimado";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";
import {
  CreditCard,
  Calendar,
  DollarSign,
  Trash2,
  Plus,
  Pause,
  Play,
  TrendingUp,
  Zap,
  AlertCircle,
  Archive,
  RefreshCw,
} from "lucide-react";

interface AssinaturaType {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number;
  ciclo: string;
  proximaRenovacao: string;
  ativa: boolean;
  canceladaEm: string | null;
  excluida: boolean;
  criadoEm: string;
  categoria: { id: string; name: string; color: string } | null;
  conta: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
}

interface ResumoType {
  totalAtivas: number;
  totalExcluidas: number;
  valorMensal: number;
  valorAnual: number;
  proximasRenovacoes: number;
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v / 100);
}

function getCicloLabel(ciclo: string): string {
  const labels: Record<string, string> = {
    SEMANAL: "Semanal",
    QUINZENAL: "Quinzenal",
    MENSAL: "Mensal",
    BIMESTRAL: "Bimestral",
    TRIMESTRAL: "Trimestral",
    SEMESTRAL: "Semestral",
    ANUAL: "Anual",
  };
  return labels[ciclo] || ciclo;
}

function getDaysUntilRenewal(date: string): number {
  return Math.ceil(
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export default function AssinaturasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assinaturas, setAssinaturas] = useState<AssinaturaType[]>([]);
  const [resumo, setResumo] = useState<ResumoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchAssinaturas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assinaturas?showDeleted=${showDeleted}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssinaturas(data.assinaturas || []);
      setResumo(data.resumo || null);
      setError("");
    } catch {
      setError("Erro ao carregar assinaturas");
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }
    if (status === "authenticated") fetchAssinaturas();
  }, [status, router, fetchAssinaturas]);

  const handleToggleAtiva = async (id: string, ativa: boolean) => {
    const action = ativa ? "pausar" : "reativar";
    if (
      !confirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} esta assinatura?`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/assinaturas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ativa: !ativa,
          canceladaEm: ativa ? new Date().toISOString() : null,
        }),
      });
      if (res.ok) fetchAssinaturas();
      else alert("Erro");
    } catch {
      alert("Erro");
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Enviar assinatura para lixeira?")) return;
    try {
      const res = await fetch(`/api/assinaturas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchAssinaturas();
      else alert("Erro");
    } catch {
      alert("Erro");
    }
  };

  if (status === "loading") {
    return <CarregamentoNeural message="Validando Ciclos de Assinaturas..." variant="full" />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <CabecalhoPagina
          title="Assinaturas de Serviços"
          description="Controle seus gastos recorrentes e evite cobranças indesejadas"
          breadcrumbs={[{ label: "Assinaturas" }]}
        >
          <div className="flex items-center gap-2 mr-2">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setShowDeleted(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!showDeleted ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Zap className="w-3 h-3" />
                Ativas
                {resumo && resumo.totalAtivas > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${!showDeleted ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                    {resumo.totalAtivas}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowDeleted(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showDeleted ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Archive className="w-3 h-3" />
                Lixeira
                {resumo && resumo.totalExcluidas > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${showDeleted ? "bg-amber-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                    {resumo.totalExcluidas}
                  </span>
                )}
              </button>
            </div>
          </div>
          <button
            onClick={fetchAssinaturas}
            className="p-2 text-slate-400 hover:text-emerald-400 transition-colors hidden sm:block"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">Nova Assinatura</span>
          </button>
        </CabecalhoPagina>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Resumo */}
          {resumo && !showDeleted && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900/50 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Assinaturas Ativas
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {resumo.totalAtivas}
                </p>
              </div>
              <div className="p-5 bg-slate-900/50 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-400">Gasto Mensal</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(resumo.valorMensal)}
                </p>
              </div>
              <div className="p-5 bg-slate-900/50 rounded-xl border border-cyan-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-sm text-slate-400">Gasto Anual</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">
                  {formatCurrency(resumo.valorAnual)}
                </p>
              </div>
              <div className="p-5 bg-slate-900/50 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Renovam em 7 dias
                  </span>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {resumo.proximasRenovacoes}
                </p>
              </div>
            </div>
          )}

          {/* Alertas de renovação */}
          {resumo && resumo.proximasRenovacoes > 0 && !showDeleted && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300">
                {resumo.proximasRenovacoes} assinatura(s) renovam nos próximos 7
                dias. Verifique suas renovações.
              </p>
            </div>
          )}

          {loading && (
            <CarregamentoNeural message="Sincronizando Assinaturas..." variant="card" />
          )}

          {!loading && !error && assinaturas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <CreditCard className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {showDeleted
                  ? "Lixeira vazia"
                  : "Nenhuma assinatura cadastrada"}
              </h3>
              <p className="text-slate-400 text-center mb-4">
                {showDeleted
                  ? "Assinaturas excluídas aparecerão aqui"
                  : "Cadastre suas assinaturas para controlar gastos recorrentes"}
              </p>
              {!showDeleted && (
                <button
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg"
                >
                  <Plus className="w-4 h-4" /> Nova Assinatura
                </button>
              )}
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Grid de Assinaturas */}
          {!loading && !error && assinaturas.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assinaturas.map((a) => {
                const dias = getDaysUntilRenewal(a.proximaRenovacao);
                const renovacaoProxima = dias >= 0 && dias <= 7;
                return (
                  <div
                    key={a.id}
                    className={`relative p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-xl border transition-all hover:shadow-lg ${
                      !a.ativa
                        ? "opacity-60 border-slate-700"
                        : renovacaoProxima
                          ? "border-amber-500/40"
                          : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {a.nome}
                        </h3>
                        {a.descricao && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {a.descricao}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!a.ativa && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-700 text-slate-400">
                            Pausada
                          </span>
                        )}
                        {renovacaoProxima && a.ativa && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Renova em {dias}d
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Valor e Ciclo */}
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(a.valor)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getCicloLabel(a.ciclo)}
                      </p>
                    </div>

                    {/* Próxima Renovação */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                      <Calendar className="w-3 h-3" />
                      Próxima:{" "}
                      {new Date(a.proximaRenovacao).toLocaleDateString("pt-BR")}
                    </div>

                    {/* Categoria / Conta */}
                    {(a.categoria || a.conta) && (
                      <div className="flex items-center gap-2 mb-3">
                        {a.categoria && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${a.categoria.color}20`,
                              color: a.categoria.color,
                            }}
                          >
                            {a.categoria.name}
                          </span>
                        )}
                        {a.conta && (
                          <span className="text-xs text-slate-500">
                            {a.conta.icon} {a.conta.name}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleToggleAtiva(a.id, a.ativa)}
                            className={`p-1.5 rounded-lg ${a.ativa ? "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10" : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"}`}
                          >
                            {a.ativa ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{a.ativa ? "Pausar" : "Reativar"}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleArchive(a.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enviar para Lixeira</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Modal Nova Assinatura */}
        {showNewModal && (
          <NovaAssinaturaModal
            onClose={() => setShowNewModal(false)}
            onSuccess={() => {
              setShowNewModal(false);
              fetchAssinaturas();
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// modal nova assinatura
function NovaAssinaturaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    valor: "",
    ciclo: "MENSAL",
    proximaRenovacao: "",
    categoriaId: "",
    contaId: "",
  });

  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showOtherAccount, setShowOtherAccount] = useState(false);
  const [customAccount, setCustomAccount] = useState("");

  const handleCategoryChange = (val: string) => {
    if (val === "OTHER") {
      setShowOtherCategory(true);
      setForm({ ...form, categoriaId: "" });
    } else {
      setShowOtherCategory(false);
      setForm({ ...form, categoriaId: val });
    }
  };

  const handleAccountChange = (val: string) => {
    if (val === "OTHER") {
      setShowOtherAccount(true);
      setForm({ ...form, contaId: "" });
    } else {
      setShowOtherAccount(false);
      setForm({ ...form, contaId: val });
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/categorias", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : [],
      ),
      fetch("/api/contas", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : [],
      ),
    ]).then(([cats, accs]) => {
      setCategorias(Array.isArray(cats) ? cats : cats.categories || []);
      setContas(Array.isArray(accs) ? accs : accs.accounts || []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalCategoryId = form.categoriaId;
      let finalAccountId = form.contaId;

      // Criar Categoria on-the-fly
      if (showOtherCategory && customCategory.trim()) {
        const catRes = await fetch("/api/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: customCategory,
            type: "EXPENSE",
            color: "#10B981", 
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
               color: "#3B82F6",
               icon: "💳"
            })
         });
         if (accRes.ok) {
            const accData = await accRes.json();
            finalAccountId = accData.account?.id || accData.id;
         }
      }

      const res = await fetch("/api/assinaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          valor: parseFloat(form.valor),
          categoriaId: finalCategoryId || null,
          contaId: finalAccountId || null,
        }),
      });
      if (res.ok) onSuccess();
      else {
        const d = await res.json();
        alert(d.error || "Erro");
      }
    } catch {
      alert("Erro ao criar assinatura");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm";
  const ciclos = [
    "SEMANAL",
    "QUINZENAL",
    "MENSAL",
    "BIMESTRAL",
    "TRIMESTRAL",
    "SEMESTRAL",
    "ANUAL",
  ];

  return (
    <ModalAnimado
      isOpen={true}
      onClose={onClose}
      title="Nova Assinatura"
      subtitle="Cadastre uma assinatura recorrente"
      icon={<CreditCard className="w-6 h-6 text-white" />}
      theme="emerald"
      maxWidth="lg"
    >
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nome *</label>
            <input
              className={inputClass}
              required
              placeholder="Ex: Netflix, Spotify, Academia"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Descrição
            </label>
            <input
              className={inputClass}
              placeholder="Plano familiar, etc."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                required
                placeholder="55.90"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Ciclo *
              </label>
              <select
                className={inputClass}
                value={form.ciclo}
                onChange={(e) => setForm({ ...form, ciclo: e.target.value })}
              >
                {ciclos.map((c) => (
                  <option key={c} value={c}>
                    {getCicloLabel(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Próxima Renovação *
            </label>
            <input
              type="date"
              className={`${inputClass} appearance-none cursor-pointer hover:border-emerald-500/50 transition-colors`}
              required
              value={form.proximaRenovacao}
              onChange={(e) =>
                setForm({ ...form, proximaRenovacao: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Categoria
              </label>
              <select
                className={inputClass}
                value={showOtherCategory ? "OTHER" : form.categoriaId}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Selecione...</option>
                {categorias
                  .filter((c: any) => c.type === "EXPENSE")
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                <option value="OTHER">➕ Outra...</option>
              </select>
              {showOtherCategory && (
                <input
                  className={`${inputClass} mt-2 border-emerald-500/50`}
                  placeholder="Nova Categoria"
                  autoFocus
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Conta</label>
              <select
                className={inputClass}
                value={showOtherAccount ? "OTHER" : form.contaId}
                onChange={(e) => handleAccountChange(e.target.value)}
              >
                <option value="">Selecione...</option>
                {contas.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
                <option value="OTHER">➕ Outra...</option>
              </select>
              {showOtherAccount && (
                <input
                  className={`${inputClass} mt-2 border-blue-500/50`}
                  placeholder="Nova Conta"
                  autoFocus
                  value={customAccount}
                  onChange={(e) => setCustomAccount(e.target.value)}
                />
              )}
            </div>
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
              {loading ? "Salvando..." : "Criar Assinatura"}
            </button>
          </div>
        </form>
    </ModalAnimado>
  );
}
