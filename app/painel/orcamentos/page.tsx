"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { PiggyBank, AlertTriangle, RefreshCw, Save } from "lucide-react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v / 100);
}

export default function OrcamentosPage() {
  const { status } = useSession();
  const router = useRouter();
  const [budget, setBudget] = useState<any>(null);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [limite, setLimite] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("80");
  const [alertEnabled, setAlertEnabled] = useState(true);

  const fetchBudget = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orcamentos?mes=${mes}&ano=${ano}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBudget(data.budget);
      setResumo(data.resumo);
      if (data.budget) {
        setLimite(String(data.budget.globalLimit / 100));
        setAlertThreshold(String(data.budget.alertThreshold));
        setAlertEnabled(data.budget.alertEnabled);
      } else {
        setLimite("");
        setAlertThreshold("80");
        setAlertEnabled(true);
      }
    } catch {
      console.error("Erro");
    } finally {
      setLoading(false);
    }
  }, [status, mes, ano]);

  useEffect(() => {
    if (status === "authenticated") fetchBudget();
  }, [status, fetchBudget]);
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

  const salvar = async () => {
    if (!limite) return;
    setSaving(true);
    try {
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: mes,
          year: ano,
          globalLimit: parseFloat(limite),
          alertThreshold: parseInt(alertThreshold),
          alertEnabled,
        }),
      });
      if (res.ok) fetchBudget();
    } catch {
      console.error("Erro");
    } finally {
      setSaving(false);
    }
  };

  const percentualGasto = resumo?.percentualGasto || 0;
  const barColor =
    percentualGasto >= 100
      ? "bg-red-500"
      : percentualGasto >= 80
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title="Orçamentos"
        subtitle="Defina limites mensais de gastos"
        onRefresh={fetchBudget}
      />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex gap-4 mb-8">
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2024, m - 1).toLocaleDateString("pt-BR", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {/* Card de progresso */}
            {resumo && resumo.globalLimit > 0 && (
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Progresso do Mês
                  </h3>
                  {resumo.alerta && (
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm">
                        Alerta: {percentualGasto}% usado
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      Gasto: {formatCurrency(resumo.spentAmount)}
                    </span>
                    <span className="text-slate-400">
                      Limite: {formatCurrency(resumo.globalLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(percentualGasto, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      {percentualGasto}% usado
                    </span>
                    <span
                      className={
                        resumo.restante >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {resumo.restante >= 0 ? "Restam " : "Excedeu "}
                      {formatCurrency(Math.abs(resumo.restante))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Formulário */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {budget ? "Editar Orçamento" : "Criar Orçamento"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Limite Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={limite}
                    onChange={(e) => setLimite(e.target.value)}
                    placeholder="Ex: 3000.00"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Alertar em (%)
                    </label>
                    <input
                      type="number"
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertEnabled}
                        onChange={(e) => setAlertEnabled(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      Alertas habilitados
                    </label>
                  </div>
                </div>
                <button
                  onClick={salvar}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />{" "}
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
