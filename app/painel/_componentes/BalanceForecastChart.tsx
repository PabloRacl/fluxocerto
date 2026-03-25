"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";

interface PrevisaoItem {
  mes: string;
  saldo: number;
  receitas: number;
  despesas: number;
}

interface PrevisaoData {
  saldoAtual: number;
  previsao: PrevisaoItem[];
  alerta: string | null;
  resumo: {
    mediaReceitas: number;
    mediaDespesas: number;
    saldoMensal: number;
  };
}

export function BalanceForecastChart({ userId }: { userId: string }) {
  const [data, setData] = useState<PrevisaoData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/painel/previsao", {
        credentials: "include",
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error("Erro ao carregar previsão:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Previsão de Saldo
        </h3>
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.previsao.length === 0) {
    return null;
  }

  const chartData = [
    { mes: "Hoje", saldo: data.saldoAtual / 100, receitas: 0, despesas: 0 },
    ...data.previsao.map((p) => ({
      mes: p.mes,
      saldo: p.saldo / 100,
      receitas: p.receitas / 100,
      despesas: p.despesas / 100,
    })),
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Previsão de Saldo (6 meses)
        </h3>
        <div className="flex items-center gap-2">
          {data.alerta && (
            <div className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-3 h-3" />
              Alerta
            </div>
          )}
        </div>
      </div>

      {/* Alerta */}
      {data.alerta && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{data.alerta}</p>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Receitas/mês</p>
          <p className="text-sm font-semibold text-emerald-400">
            {formatCurrency(data.resumo.mediaReceitas)}
          </p>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Despesas/mês</p>
          <p className="text-sm font-semibold text-red-400">
            {formatCurrency(data.resumo.mediaDespesas)}
          </p>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Saldo/mês</p>
          <p
            className={`text-sm font-semibold ${data.resumo.saldoMensal >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {formatCurrency(data.resumo.saldoMensal)}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `R$ ${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [formatCurrency(value * 100), ""]}
            labelStyle={{ color: "#94a3b8" }}
          />
          <ReferenceLine
            y={0}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{
              value: "R$ 0",
              position: "left",
              fill: "#ef4444",
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="saldo"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: "#10B981", r: 4 }}
            activeDot={{ r: 6 }}
            name="Saldo Projetado"
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-slate-500 mt-3 text-center">
        Projeção baseada em receitas/despesas recorrentes, assinaturas e
        parcelas pendentes
      </p>
    </div>
  );
}
