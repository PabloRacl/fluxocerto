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
import { api } from "@/biblioteca/http-client";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";

interface TimelineItem {
  data: string;
  saldoEstimado: number;
  ganhos: number;
  gastos: number;
}

interface ProjecaoData {
  resumo: {
    saldoAtual: number;
    saldoFinal: number;
    variacaoTotal: number;
    periodoDias: number;
  };
  timeline: TimelineItem[];
}

export function BalanceForecastChart({ userId }: { userId: string }) {
  const [data, setData] = useState<ProjecaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<ProjecaoData>(`/api/painel/projecao?dias=${dias}`);
      setData(d);
    } catch (err) {
      console.error("Erro ao carregar previsão:", err);
    } finally {
      setLoading(false);
    }
  }, [dias]);

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
    return <NeuralLoading message="Projetando Matriz de Saldo..." variant="card" />;
  }

  if (!data || !data.timeline || data.timeline.length === 0) {
    return null;
  }

  // ✅ Adaptador para o novo formato do ProjecaoService
  const chartData = [
    { data: "Hoje", saldo: data.resumo.saldoAtual / 100, ganhos: 0, gastos: 0 },
    ...data.timeline.map((p: any) => {
      const d = new Date(p.data);
      return {
        data: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        saldo: p.saldoEstimado / 100,
        ganhos: p.ganhos / 100,
        gastos: p.gastos / 100,
      };
    }),
  ];

  return (
    <div data-tour="chart-projecao" className="relative bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-slate-800/50 p-6 shadow-2xl group overflow-hidden">
      {/* Background glow orb */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent uppercase tracking-tighter">
              Fluxo de Caixa Projetado
            </h3>
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 rounded-full tracking-widest uppercase">
              Predictive AI
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium italic opacity-80">
            Adivinhando gastos futuros baseados nos seus padrões dos últimos 90 dias + inflação estimada (0.5% a.m.)
          </p>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700">
          {[30, 90, 180].map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dias === d 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>

      {/* Alerta */}
      {data.resumo.saldoFinal < 0 && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">Atenção! Sua projeção indica saldo negativo no final do período. Considere rever gastos fixos.</p>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
        <div className="p-3 bg-slate-900/60 rounded-2xl text-center border border-white/5 shadow-lg">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Saldo Atual</p>
          <p className="text-sm font-black text-white" style={{ textShadow: "0 0 10px rgba(255,255,255,0.2)" }}>
            {formatCurrency(data.resumo.saldoAtual)}
          </p>
        </div>
        <div className="p-3 bg-slate-900/60 rounded-2xl text-center border border-white/5 shadow-lg">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Final Estimado</p>
          <p className={`text-sm font-black ${data.resumo.saldoFinal >= 0 ? "text-emerald-400" : "text-red-400"}`} style={data.resumo.saldoFinal >= 0 ? { textShadow: "0 0 10px rgba(52,211,153,0.3)" } : { textShadow: "0 0 10px rgba(248,113,113,0.3)" }}>
            {formatCurrency(data.resumo.saldoFinal)}
          </p>
        </div>
        <div className="p-3 bg-slate-900/60 rounded-2xl text-center border border-white/5 shadow-lg">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Impacto</p>
          <p
            className={`text-sm font-black ${data.resumo.variacaoTotal >= 0 ? "text-emerald-400" : "text-red-400"}`}
            style={data.resumo.variacaoTotal >= 0 ? { textShadow: "0 0 10px rgba(52,211,153,0.3)" } : { textShadow: "0 0 10px rgba(248,113,113,0.3)" }}
          >
            {data.resumo.variacaoTotal >= 0 ? "+" : ""}{formatCurrency(data.resumo.variacaoTotal)}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[150px] w-full mt-2 relative z-10 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData}
          onMouseLeave={() => {
            // Recharts handles this internally, but sometimes it gets stuck.
            // We can ensure it's cleared by setting an internal state if needed,
            // or just by having the container handle the leave.
          }}
        >
          <defs>
            <filter id="neonGlowForecast" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="data" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} dy={10} />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `R$ ${value}`}
            tickLine={false} axisLine={false} dx={-10}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                    <p className="text-sm font-black text-white mb-2 border-b border-white/5 pb-2 uppercase tracking-widest relative z-10">{label}</p>
                    <div className="space-y-2 relative z-10">
                      <div className="flex justify-between gap-6">
                        <span className="text-xs text-slate-400">Saldo:</span>
                        <span className={`text-xs font-bold ${item.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.saldo)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-xs text-slate-400">Ganhos:</span>
                        <span className="text-xs font-bold text-blue-400">
                          +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.ganhos)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-xs text-slate-400">Gastos:</span>
                        <span className="text-xs font-bold text-red-400">
                          -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.gastos)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
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
            strokeWidth={3}
            style={{ filter: "url(#neonGlowForecast)" }}
            dot={{ fill: "#10B981", r: 4 }}
            activeDot={{ r: 7, stroke: "#10B981", strokeWidth: 3, fill: "#fff" }}
            name="Saldo Projetado"
          />
        </LineChart>
      </ResponsiveContainer>

      </div>
    </div>
  );
}
