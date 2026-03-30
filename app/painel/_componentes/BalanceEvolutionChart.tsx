"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { api } from "@/biblioteca/http-client";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";

// ============================================
// TIPOS
// ============================================
interface ChartData {
  month: string;
  balance: number;
  income: number;
  expense: number;
}

interface BalanceEvolutionChartProps {
  userId: string;
}

// ============================================
// FORMATADORES
// ============================================
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100); // Converte de centavos para reais
};

const formatMonth = (month: string) => {
  const [year, monthNum] = month.split("-");
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function BalanceEvolutionChart({ userId }: BalanceEvolutionChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"line" | "area">("area");

  // ============================================
  // BUSCAR DADOS DOS ÚLTIMOS 6 MESES
  // ============================================
  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        setLoading(true);

        // Calcular últimos 6 meses
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Primeiro dia do mês

        // Buscar transações do período
        const result = await api.get<{ data: ChartData[] }>(
          `/api/painel/balance-evolution?startDate=${sixMonthsAgo.toISOString()}&endDate=${today.toISOString()}`,
        );
        setData(result.data || []);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar evolução do saldo:", err);
        setError("Não foi possível carregar o gráfico");

        // Dados mockados para desenvolvimento
        setData([
          {
            month: "2025-10",
            balance: 500000,
            income: 300000,
            expense: 200000,
          },
          {
            month: "2025-11",
            balance: 650000,
            income: 350000,
            expense: 200000,
          },
          {
            month: "2025-12",
            balance: 800000,
            income: 400000,
            expense: 250000,
          },
          {
            month: "2026-01",
            balance: 950000,
            income: 450000,
            expense: 300000,
          },
          {
            month: "2026-02",
            balance: 1100000,
            income: 500000,
            expense: 350000,
          },
          {
            month: "2026-03",
            balance: 1250000,
            income: 550000,
            expense: 400000,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchBalanceData();
    }
  }, [userId]);

  // ============================================
  // CALCULAR VARIAÇÃO TOTAL - ✅ CORREÇÃO: EVITAR INFINITY
  // ============================================
  const calculateVariation = () => {
    if (data.length < 2) return { value: 0, percentage: 0 };

    const firstBalance = data[0].balance;
    const lastBalance = data[data.length - 1].balance;
    const variation = lastBalance - firstBalance;

    // ✅ CORREÇÃO: Evitar divisão por zero
    const percentage =
      firstBalance !== 0 ? (variation / Math.abs(firstBalance)) * 100 : 0;

    return { value: variation, percentage };
  };

  const variation = calculateVariation();
  const isPositive = variation.value >= 0;

  // ============================================
  // CALCULAR TOTAIS DO PERÍODO
  // ============================================
  const totals = data.reduce(
    (acc, curr) => ({
      totalIncome: acc.totalIncome + curr.income,
      totalExpense: acc.totalExpense + curr.expense,
    }),
    { totalIncome: 0, totalExpense: 0 },
  );

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (loading) {
    return <NeuralLoading message="Processando Evolução Temporal..." variant="card" />;
  }

  // ============================================
  // RENDER: ERROR
  // ============================================
  if (error && data.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-white mb-1">
              Evolução do Saldo
            </h3>
            <p className="text-sm text-slate-400">Últimos 6 meses</p>
          </div>
        </div>
        <div className="h-[180px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-emerald-400 hover:text-emerald-300 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // TOOLTIP CUSTOMIZADO - ✅ MOSTRA OS 3 VALORES
  // ============================================
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartData;
      return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-2xl min-w-[200px] relative overflow-hidden">
          {/* Brilho interno do Tooltip */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          
          <p className="text-sm font-black text-white mb-3 border-b border-white/5 pb-2 uppercase tracking-widest relative z-10">
            {formatMonth(data.month)}
          </p>
          <div className="space-y-2">
            {/* Saldo */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-slate-400">Saldo:</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400">
                {formatCurrency(data.balance)}
              </span>
            </div>
            {/* Receitas */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-slate-400">Receitas:</span>
              </div>
              <span className="text-xs font-semibold text-blue-400">
                +{formatCurrency(data.income)}
              </span>
            </div>
            {/* Despesas */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-3 h-3 text-red-400" />
                <span className="text-xs text-slate-400">Despesas:</span>
              </div>
              <span className="text-xs font-semibold text-red-400">
                -{formatCurrency(data.expense)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // ============================================
  // RENDER: PRINCIPAL
  // ============================================
  return (
    <div className="relative bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-slate-800/50 p-6 shadow-2xl flex flex-col group overflow-hidden">
      {/* Background glow orb */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tighter flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Evolução do Saldo
          </h3>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Fluxo temporal &bull; Últimos 6 meses</p>
        </div>

        {/* Toggle Tipo de Gráfico */}
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md rounded-xl p-1.5 border border-white/5">
          <button
            onClick={() => setChartType("area")}
            className={`px-4 py-1.5 text-[10px] font-black tracking-widest uppercase rounded-lg transition-all ${
              chartType === "area"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Área
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              chartType === "line"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Linha
          </button>
        </div>
      </div>

  {/* Gráfico */}
      <div className="h-[280px] w-full relative z-10 shrink-0 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                {/* SVG Filters for Neon Glow Effect */}
                <filter id="neonGlowLine" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Gradiente para Saldo */}
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                {/* Gradiente para Receitas */}
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                {/* Gradiente para Despesas */}
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={11}
                tickFormatter={formatMonth}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(value / 100)
                }
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
                isAnimationActive={false}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
              />

              {/* ✅ 3 LINHAS/ÁREAS: Saldo, Receitas, Despesas */}
              <Area
                type="monotone"
                dataKey="balance"
                name="Saldo"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorBalance)"
                style={{ filter: "url(#neonGlowLine)" }}
                activeDot={{
                  r: 6,
                  stroke: "#10B981",
                  strokeWidth: 3,
                  fill: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Receitas"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorIncome)"
                style={{ filter: "url(#neonGlowLine)" }}
                activeDot={{
                  r: 5,
                  stroke: "#3B82F6",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Despesas"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorExpense)"
                style={{ filter: "url(#neonGlowLine)" }}
                activeDot={{
                  r: 5,
                  stroke: "#EF4444",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
              />
            </AreaChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <filter id="neonGlowLine" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={11}
                tickFormatter={formatMonth}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(value / 100)
                }
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
                isAnimationActive={false}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
              />

              {/* ✅ 3 LINHAS: Saldo, Receitas, Despesas */}
              <Line
                type="monotone"
                dataKey="balance"
                name="Saldo"
                stroke="#10B981"
                strokeWidth={3}
                style={{ filter: "url(#neonGlowLine)" }}
                dot={{ fill: "#10B981", r: 4 }}
                activeDot={{
                  r: 7,
                  stroke: "#10B981",
                  strokeWidth: 3,
                  fill: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Receitas"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5 5"
                style={{ filter: "url(#neonGlowLine)" }}
                dot={{ fill: "#3B82F6", r: 3 }}
                activeDot={{
                  r: 6,
                  stroke: "#3B82F6",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Despesas"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                style={{ filter: "url(#neonGlowLine)" }}
                dot={{ fill: "#EF4444", r: 3 }}
                activeDot={{
                  r: 6,
                  stroke: "#EF4444",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legenda Explicativa */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-emerald-500" />
          <span className="text-slate-400">Saldo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-blue-500 border-t border-dashed border-blue-500" />
          <span className="text-slate-400">Receitas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-red-500 border-t border-dashed border-red-500" />
          <span className="text-slate-400">Despesas</span>
        </div>
      </div>
    </div>
  );
}
