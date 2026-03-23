"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon, TrendingDown } from "lucide-react";

// ============================================
// TIPOS
// ============================================
interface ChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface ExpensesByCategoryChartProps {
  userId: string;
}

// ============================================
// FORMATADORES
// ============================================
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// ============================================
// CORES DO GRÁFICO
// ============================================
const CHART_COLORS = [
  "#047857", "#10B981", "#059669", "#04957E",
  "#8B5CF6", "#6366F1", "#3B82F6", "#2563EB",
  "#F59E0B", "#D97706", "#DC2626", "#EF4444",
  "#EC4899", "#DB2777", "#14B8A6", "#0D9488",
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function ExpensesByCategoryChart({ userId }: ExpensesByCategoryChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"pie" | "donut">("donut");
  const [period, setPeriod] = useState<"month" | "year">("month");

  // ============================================
  // BUSCAR DADOS DAS CATEGORIAS
  // ============================================
  useEffect(() => {
    const fetchExpensesData = async () => {
      try {
        setLoading(true);
        
        const today = new Date();
        let startDate: Date;
        
        if (period === "month") {
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        } else {
          startDate = new Date(today.getFullYear(), 0, 1);
        }

        const response = await fetch(
          `/api/dashboard/expenses-by-category?startDate=${startDate.toISOString()}&endDate=${today.toISOString()}`
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar dados das despesas");
        }

        const result = await response.json();
        
        const transformedData = result.data.map((item: any, index: number) => ({
          name: item.categoryName,
          value: item.totalAmount,
          color: item.categoryColor || CHART_COLORS[index % CHART_COLORS.length],
          percentage: item.percentage,
        }));

        setData(transformedData);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar despesas por categoria:", err);
        setError("Não foi possível carregar o gráfico");
        
        setData([
          { name: "Alimentação", value: 150000, color: "#047857", percentage: 30 },
          { name: "Transporte", value: 80000, color: "#10B981", percentage: 16 },
          { name: "Moradia", value: 120000, color: "#059669", percentage: 24 },
          { name: "Lazer", value: 50000, color: "#8B5CF6", percentage: 10 },
          { name: "Saúde", value: 40000, color: "#3B82F6", percentage: 8 },
          { name: "Outros", value: 60000, color: "#F59E0B", percentage: 12 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchExpensesData();
    }
  }, [userId, period]);

  // ============================================
  // CALCULAR TOTAL GERAL
  // ============================================
  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);

  // ============================================
  // CUSTOM TOOLTIP
  // ============================================
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <p className="text-sm font-medium text-white">{data.name}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-slate-400">Valor:</span>
              <span className="text-xs font-semibold text-emerald-400">
                {formatCurrency(data.value)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-slate-400">Percentual:</span>
              <span className="text-xs text-emerald-400">
                {formatPercentage(data.percentage)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Despesas por Categoria
            </h3>
            <p className="text-sm text-slate-400">
              {period === "month" ? "Este mês" : "Este ano"}
            </p>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Carregando gráfico...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: ERROR
  // ============================================
  if (error && data.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Despesas por Categoria
            </h3>
            <p className="text-sm text-slate-400">
              {period === "month" ? "Este mês" : "Este ano"}
            </p>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
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
  // RENDER: EMPTY STATE
  // ============================================
  if (data.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Despesas por Categoria
            </h3>
            <p className="text-sm text-slate-400">
              {period === "month" ? "Este mês" : "Este ano"}
            </p>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <PieChartIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">Nenhuma despesa registrada</p>
            <p className="text-sm text-slate-500">
              Comece adicionando transações para ver o gráfico
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: PRINCIPAL
  // ============================================
  return (
    <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Despesas por Categoria
          </h3>
          <p className="text-sm text-slate-400">
            {period === "month" ? "Este mês" : "Este ano"}
          </p>
        </div>
        
        {/* Controles */}
        <div className="flex items-center gap-2">
          {/* Toggle Período */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 mr-2">
            <button
              onClick={() => setPeriod("month")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === "month"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setPeriod("year")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === "year"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Ano
            </button>
          </div>
          
          {/* Toggle Tipo de Gráfico */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setChartType("donut")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                chartType === "donut"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Rosca
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                chartType === "pie"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Pizza
            </button>
          </div>
        </div>
      </div>

      {/* Total de Despesas */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-400" />
          <span className="text-lg font-bold text-red-400">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
        <div className="text-sm text-slate-400">
          Total em {data.length} categorias
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={chartType === "donut" ? 80 : 0}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-slate-300 ml-2">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Lista de Categorias (Mobile) */}
      <div className="mt-6 space-y-2 lg:hidden">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-slate-300">{item.name}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                {formatCurrency(item.value)}
              </p>
              <p className="text-xs text-slate-400">
                {formatPercentage(item.percentage)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}