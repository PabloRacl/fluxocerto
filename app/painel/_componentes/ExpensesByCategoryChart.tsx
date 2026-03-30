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
  List
} from "lucide-react";
import { api } from "@/biblioteca/http-client";
import { NeuralLoading } from "@/app/painel/_componentes/NeuralLoading";
import { AnimatedModal } from "@/app/painel/_componentes/AnimatedModal";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// TIPOS
// ============================================
interface ChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
  categoryName?: string;
  categoryColor?: string;
  totalAmount?: number;
  transactions?: Array<{
    id: string;
    description: string;
    amount: number;
    date: Date | string;
  }>;
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
// CORES
// ============================================
const CHART_COLORS = [
  "#EF4444", "#FA1564", "#F43F5E", "#E11D48", 
  "#F97316", "#F59E0B", "#D97706", "#EA580C",
  "#F87171", "#FB923C", "#FBBF24", "#FB7185"
];

const animateChart = (delay: number = 0) => {
  return {
    animationDuration: 800,
    animationEasing: "ease-out" as const,
    animationBegin: delay,
  };
};

export function ExpensesByCategoryChart({
  userId,
}: ExpensesByCategoryChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"pie" | "donut">("donut");
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  // ============================================
  // BUSCAR DADOS
  // ============================================
  useEffect(() => {
    const fetchExpensesData = async () => {
      try {
        setLoading(true);

        const today = new Date();
        let startDate: Date;
        let endDate: Date;

        if (period === "month") {
          // Início do mês em UTC (00:00:00Z) para bater com o resumo rápido (SummaryCards)
          startDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
          // Fim do mês em UTC (23:59:59Z)
          endDate = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59));
        } else {
          startDate = new Date(Date.UTC(today.getFullYear(), 0, 1));
          endDate = new Date(Date.UTC(today.getFullYear(), 11, 31, 23, 59, 59));
        }

        const result = await api.get<{ data: any[] }>(
          `/api/painel/expenses-by-category?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        );

        const transformedData = (result.data || []).map((item: any, index: number) => ({
          name: item.categoryName,
          value: item.totalAmount,
          color:
            item.categoryColor || CHART_COLORS[index % CHART_COLORS.length],
          percentage: item.percentage,
          transactions: item.transactions || [], // ✅ Atribuir os itens individuais
        }));

        const sortedData = transformedData.sort(
          (a: { value: number }, b: { value: number }) => b.value - a.value,
        );

        setData(sortedData);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar despesas por categoria:", err);
        setError("Não foi possível carregar o gráfico");
        
        setData(
          [
            { name: "Alimentação", value: 150000, color: "#F59E0B", percentage: 30 },
            { name: "Moradia", value: 120000, color: "#3B82F6", percentage: 24 },
            { name: "Transporte", value: 80000, color: "#10B981", percentage: 16 },
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

  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);
  const displayData = data.slice(0, 5);
  const hasMore = data.length > 5;

  // ============================================
  // TOOLTIP
  // ============================================
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-2xl min-w-[220px] transform transition-all z-50 relative overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 via-transparent to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5 relative z-10">
            <div
              className="w-4 h-4 rounded-full shadow-lg"
              style={{ backgroundColor: pData.color }}
            />
            <p className="text-sm font-semibold text-white">{pData.name}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">Valor:</span>
              <span className="text-sm font-bold text-red-400">
                {formatCurrency(pData.value)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">Percentual:</span>
              <span className="text-sm font-bold text-blue-400">
                {formatPercentage(pData.percentage)}
              </span>
            </div>
            {totalExpenses > 0 && (
              <div className="pt-2 mt-2 border-t border-white/5 relative z-10">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Do total:</span>
                  <span className="text-xs font-black text-slate-300">
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
  // LEGENDA
  // ============================================
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {displayData.map((entry: any, index: number) => (
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
              {formatCurrency(entry.value)}
            </span>
            <span className="text-xs text-slate-400">
              ({formatPercentage(data[index]?.percentage || 0)})
            </span>
          </button>
        ))}
        {hasMore && (
          <button
            onClick={() => setShowAllModal(true)}
            className="px-3 py-1.5 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-all border border-emerald-500/20"
          >
            +{data.length - 5} mais
          </button>
        )}
      </div>
    );
  };

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return <NeuralLoading message="Categorizando Fluxo de Gastos..." variant="card" />;
  }

  // ============================================
  // ERROR E EMPTY STATE
  // ============================================
  if (error && data.length === 0) {
    return (
      <div className="relative bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-slate-800/50 p-6 shadow-2xl h-full flex flex-col group overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tighter">
              Distribuição de Gastos e Dívidas
            </h3>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
              {period === "month" ? "Este mês" : "Este ano"}
            </p>
          </div>
        </div>
        <div className="h-[240px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={() => window.location.reload()} className="text-sm text-emerald-400 hover:text-emerald-300 underline">
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="relative bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-slate-800/50 p-6 shadow-2xl h-full flex flex-col group overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tighter">
              Distribuição de Gastos e Dívidas
            </h3>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
              {period === "month" ? "Este mês" : "Este ano"}
            </p>
          </div>
        </div>
        <div className="h-[240px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <PieChartIcon className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-300 font-medium mb-1">
              Nenhuma despesa registrada
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div className="relative bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-slate-800/50 p-6 shadow-2xl flex flex-col group overflow-hidden">
      {/* Background glow orb */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tighter flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
            Distribuição de Gastos e Dívidas
          </h3>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
            {period === "month" ? "Ciclo Mensal Atual" : "Visão Panorâmica Anual"}
          </p>
        </div>

        <div className="flex items-center gap-2 transition-all">
          <button
            onClick={() => setShowAllModal(true)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-slate-800 hover:border-emerald-500/30 transition-all"
            title="Ver Detalhamento"
          >
            <List className="w-5 h-5" />
          </button>
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

          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 hidden sm:flex">
            <button
              onClick={() => setChartType("donut")}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                chartType === "donut" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              Rosca
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                chartType === "pie" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              Pizza
            </button>
          </div>
        </div>
      </div>

      <div className="mb-2 sm:hidden flex justify-end relative z-10">
        <button onClick={() => setShowAllModal(true)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300">
            <List className="w-5 h-5" />
        </button>
      </div>

      {/* Layout Side-by-Side (Neuro HUD) */}
      <div 
        className="flex-1 flex flex-col sm:flex-row items-center gap-6 min-h-0"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Lado Esquerdo: Neuro Core e Gráfico */}
        <div className="relative w-[220px] h-[220px] flex-shrink-0 flex items-center justify-center">
            {/* Camada Central: Neuro Core (Holograma) */}
            {!loading && data.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={hoveredIndex ?? 'idle'}
                        initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
                        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                        exit={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative flex items-center justify-center"
                    >
                        {/* Brilho de Fundo do Núcleo */}
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.15, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-16 h-16 rounded-full blur-2xl"
                            style={{ 
                                backgroundColor: hoveredIndex !== null ? data[hoveredIndex].color : '#10B981' 
                            }}
                        />
                        
                        {/* Círculo de Vidro Central */}
                        <div className="w-16 h-16 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center shadow-2xl overflow-hidden">
                            {hoveredIndex !== null ? (
                            <div className="flex flex-col items-center">
                                <span className="text-lg mb-0.5">
                                    {data[hoveredIndex].name === "Alimentação" ? "🍕" : 
                                    data[hoveredIndex].name === "Moradia" ? "🏠" : 
                                    data[hoveredIndex].name === "Transporte" ? "🚗" : "💰"}
                                </span>
                                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest text-center px-1 line-clamp-1">
                                    {data[hoveredIndex].name}
                                </span>
                            </div>
                            ) : (
                            <div className="flex flex-col items-center">
                                <PieChartIcon className="w-4 h-4 text-emerald-500/50 mb-1 animate-pulse" />
                                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">Fluxo Total</span>
                            </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
                    <PieChart onMouseLeave={() => setHoveredIndex(null)}>
                    <defs>
                        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <Pie
                        data={chartType === "donut" ? data : displayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={chartType === "donut" ? 54 : 0}
                        outerRadius={74}
                        cornerRadius={6}
                        paddingAngle={chartType === "donut" ? 4 : 2}
                        dataKey="value"
                        stroke="none"
                        {...animateChart(200)}
                        onMouseEnter={(_, index) => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        {(chartType === "donut" ? data : displayData).map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.2}
                                style={{ 
                                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", 
                                    cursor: "pointer",
                                    filter: hoveredIndex === index ? "url(#neonGlow)" : "none"
                                }}
                            />
                        ))}
                    </Pie>
                    <Tooltip 
                        content={<CustomTooltip />} 
                        isAnimationActive={false}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>

        {/* Lado Direito: Legenda Lateral */}
        <div className="flex-1 w-full max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 gap-2">
                {(chartType === "donut" ? data : displayData).map((entry, index) => (
                    <button
                        key={`legend-side-${index}`}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`group flex items-center justify-between p-2 rounded-xl transition-all border ${
                            hoveredIndex === index 
                            ? "bg-slate-800/80 border-slate-600 scale-[1.02]" 
                            : "bg-slate-800/20 border-transparent opacity-70 hover:opacity-100"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }} />
                            <div className="text-left">
                                <p className="text-[11px] font-bold text-white mb-0.5 line-clamp-1">{entry.name}</p>
                                <p className="text-[10px] text-slate-500">{formatPercentage(entry.percentage)}</p>
                            </div>
                        </div>
                        <span className="text-xs font-black text-slate-400 group-hover:text-red-400 transition-colors">
                            {formatCurrency(entry.value)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Modal Ver Mais Categorias (usando AnimatedModal existente) */}
      <AnimatedModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        title="Totais por Categoria"
        subtitle={`Detalhamento para o período (${period === 'month' ? 'Mensal' : 'Anual'})`}
        icon={<PieChartIcon className="w-6 h-6 text-white" />}
        theme="blue"
        maxWidth="md"
      >
        <div className="p-6">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {data.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.categoryColor || item.color }}
                    />
                    <span className="text-base font-bold text-white uppercase tracking-tight">
                      {item.categoryName || item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">
                      {formatCurrency(item.totalAmount || item.value)}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase">
                      {formatPercentage(item.percentage)} do total
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {item.transactions?.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-2 px-3 bg-slate-900/40 rounded-lg hover:bg-slate-900/60 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-200">
                          {t.description}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">
                          {new Date(t.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-300">
                        {formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))}
                  {(!item.transactions || item.transactions.length === 0) && (
                    <p className="text-[10px] text-slate-600 italic text-center py-1">
                      Sem detalhes individuais para esta categoria
                    </p>
                  )}
                </div>
              </div>
            ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Total Geral</span>
                <span className="text-xl font-bold text-red-400">{formatCurrency(totalExpenses)}</span>
            </div>
        </div>
      </AnimatedModal>
    </div>
  );
}
