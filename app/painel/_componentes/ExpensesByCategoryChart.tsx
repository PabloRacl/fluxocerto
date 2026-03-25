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
import {
  PieChart as PieChartIcon,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

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
// ✅ CORES OTIMIZADAS - PALETA HARMÔNICA
// ============================================
const CHART_COLORS = [
  // Verde (Finanças)
  "#10B981", // emerald-500
  "#34D399", // emerald-400
  "#059669", // emerald-600
  "#6EE7B7", // emerald-300

  // Azul (Tecnologia/Serviços)
  "#3B82F6", // blue-500
  "#60A5FA", // blue-400
  "#2563EB", // blue-600
  "#93C5FD", // blue-300

  // Roxo (Lazer/Educação)
  "#8B5CF6", // violet-500
  "#A78BFA", // violet-400
  "#7C3AED", // violet-600

  // Laranja/Âmbar (Alimentação)
  "#F59E0B", // amber-500
  "#FBBF24", // amber-400
  "#D97706", // amber-600

  // Rosa/Vermelho (Saúde/Urgências)
  "#EC4899", // pink-500
  "#F43F5E", // rose-500
  "#EF4444", // red-500
];

// ============================================
// ✅ ANIMAÇÃO CUSTOMIZADA
// ============================================
const animateChart = (delay: number = 0) => {
  return {
    animationDuration: 800,
    animationEasing: "ease-out" as const,
    animationBegin: delay,
  };
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function ExpensesByCategoryChart({
  userId,
}: ExpensesByCategoryChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"pie" | "donut">("donut");
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

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
          `/api/painel/expenses-by-category?startDate=${startDate.toISOString()}&endDate=${today.toISOString()}`,
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar dados das despesas");
        }

        const result = await response.json();

        const transformedData = result.data.map((item: any, index: number) => ({
          name: item.categoryName,
          value: item.totalAmount,
          color:
            item.categoryColor || CHART_COLORS[index % CHART_COLORS.length],
          percentage: item.percentage,
        }));

        // ✅ ORDENAR POR VALOR (maior para menor)
        const sortedData = transformedData.sort(
          (a: { value: number }, b: { value: number }) => b.value - a.value,
        );

        setData(sortedData);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar despesas por categoria:", err);
        setError("Não foi possível carregar o gráfico");

        // Dados mockados ordenados
        setData(
          [
            {
              name: "Alimentação",
              value: 150000,
              color: "#F59E0B",
              percentage: 30,
            },
            {
              name: "Moradia",
              value: 120000,
              color: "#3B82F6",
              percentage: 24,
            },
            {
              name: "Transporte",
              value: 80000,
              color: "#10B981",
              percentage: 16,
            },
            { name: "Lazer", value: 50000, color: "#8B5CF6", percentage: 10 },
            { name: "Saúde", value: 40000, color: "#EF4444", percentage: 8 },
            { name: "Outros", value: 60000, color: "#EC4899", percentage: 12 },
          ].sort((a, b) => b.value - a.value),
        );
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
  const displayData = showAll ? data : data.slice(0, 5);
  const hasMore = data.length > 5;

  // ============================================
  // ✅ TOOLTIP MELHORADO
  // ============================================
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-2xl min-w-[220px] transform transition-all">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700">
            <div
              className="w-4 h-4 rounded-full shadow-lg"
              style={{ backgroundColor: data.color }}
            />
            <p className="text-sm font-semibold text-white">{data.name}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">Valor:</span>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(data.value)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">Percentual:</span>
              <span className="text-sm font-bold text-blue-400">
                {formatPercentage(data.percentage)}
              </span>
            </div>
            {totalExpenses > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-700">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-400">Do total:</span>
                  <span className="text-xs font-medium text-slate-300">
                    {formatCurrency(totalExpenses)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // ============================================
  // ✅ LEGENDA CUSTOMIZADA COM PORCENTAGEM
  // ============================================
  const CustomLegend = ({ payload }: any) => {
    const displayPayload = showAll ? payload : payload.slice(0, 5);
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {displayPayload.map((entry: any, index: number) => (
          <button
            key={`legend-${index}`}
            onClick={() =>
              setHoveredIndex(hoveredIndex === index ? null : index)
            }
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              hoveredIndex === index || hoveredIndex === null
                ? "bg-slate-800/80"
                : "bg-slate-800/30 opacity-50"
            }`}
          >
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-300 font-medium">
              {entry.value}
            </span>
            <span className="text-xs text-slate-400">
              ({formatPercentage(data[index]?.percentage || 0)})
            </span>
          </button>
        ))}
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="px-3 py-1.5 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-all"
          >
            +{data.length - 5} mais
          </button>
        )}
        {showAll && hasMore && (
          <button
            onClick={() => setShowAll(false)}
            className="px-3 py-1.5 text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
          >
            Ver menos
          </button>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER: LOADING COM SKELETON
  // ============================================
  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-5 w-48 bg-slate-800 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-8 w-16 bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-8 border-slate-800 animate-pulse" />
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
  // RENDER: EMPTY STATE MELHORADO
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
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <PieChartIcon className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-300 font-medium mb-1">
              Nenhuma despesa registrada
            </p>
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
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                period === "month"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setPeriod("year")}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                period === "year"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              Ano
            </button>
          </div>

          {/* Toggle Tipo de Gráfico */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setChartType("donut")}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                chartType === "donut"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              Rosca
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                chartType === "pie"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              Pizza
            </button>
          </div>
        </div>
      </div>

      {/* Total de Despesas */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <TrendingDown className="w-5 h-5 text-red-400" />
          <span className="text-lg font-bold text-red-400">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
        <div className="text-sm text-slate-400">
          Total em{" "}
          <span className="text-white font-semibold">{data.length}</span>{" "}
          categorias
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={chartType === "donut" ? 80 : 0}
              outerRadius={120}
              paddingAngle={chartType === "donut" ? 3 : 2}
              dataKey="value"
              stroke="none"
              {...animateChart(200)}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={
                    hoveredIndex === null || hoveredIndex === index ? 1 : 0.5
                  }
                  style={{
                    transition: "opacity 0.3s ease",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Lista de Categorias (Mobile) */}
      <div className="mt-6 space-y-2 lg:hidden">
        <p className="text-sm font-medium text-slate-300 mb-3">Detalhamento:</p>
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-slate-300">
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
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
