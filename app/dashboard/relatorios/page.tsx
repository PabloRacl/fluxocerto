"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// FORMATADORES
// ============================================
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

const formatMonth = (month: number, year: number) => {
  return new Date(year, month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function ReportsPage() {
  const { status, data } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // ============================================
  // BUSCAR RELATÓRIO
  // ============================================
  const fetchReport = useCallback(async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/monthly?month=${selectedMonth}&year=${selectedYear}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar relatório");
      }

      const result = await response.json();
      setReport(result);
    } catch (err) {
      console.error("Erro ao buscar relatório:", err);
    } finally {
      setLoading(false);
    }
  }, [status, selectedMonth, selectedYear]);

  // ============================================
  // EFFECT
  // ============================================
  useEffect(() => {
    if (status === "authenticated") {
      fetchReport();
    }
  }, [status, fetchReport]);

  // ============================================
  // EXPORTAR CSV
  // ============================================
  const handleExportCSV = async () => {
    const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString();

    const link = document.createElement("a");
    link.href = `/api/reports/export?startDate=${startDate}&endDate=${endDate}&format=csv`;
    link.download = `transacoes_${selectedMonth}_${selectedYear}.csv`;
    link.click();
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: NÃO AUTENTICADO
  // ============================================
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // ============================================
  // RENDER: PRINCIPAL
  // ============================================
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ← Voltar
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white">Relatórios</h1>
                  <p className="text-sm text-slate-400">Análise financeira detalhada</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchReport}
                  className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filtros de Período */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <label className="text-sm text-slate-300">Mês:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {new Date(2024, month - 1).toLocaleDateString("pt-BR", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-300">Ano:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[2024, 2025, 2026, 2027].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={fetchReport}
                className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
              >
                Gerar Relatório
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-slate-400">Gerando relatório...</span>
            </div>
          )}

          {/* Conteúdo do Relatório */}
          {!loading && report && (
            <>
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Receitas */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Receitas</span>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(report.summary.totalIncome)}
                  </p>
                  {report.comparison.incomeVariation !== 0 && (
                    <p
                      className={`text-xs mt-2 ${
                        report.comparison.incomeVariation >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {report.comparison.incomeVariation >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(report.comparison.incomeVariation).toFixed(1)}% vs mês anterior
                    </p>
                  )}
                </div>

                {/* Despesas */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Despesas</span>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(report.summary.totalExpense)}
                  </p>
                  {report.comparison.expenseVariation !== 0 && (
                    <p
                      className={`text-xs mt-2 ${
                        report.comparison.expenseVariation <= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {report.comparison.expenseVariation <= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(report.comparison.expenseVariation).toFixed(1)}% vs mês anterior
                    </p>
                  )}
                </div>

                {/* Saldo */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Saldo do Mês</span>
                    <Wallet className="w-5 h-5 text-blue-500" />
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      report.summary.balance >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(report.summary.balance)}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {report.summary.transactionCount} transações
                  </p>
                </div>

                {/* Período */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Período</span>
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-lg font-semibold text-white capitalize">
                    {formatMonth(selectedMonth, selectedYear)}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(report.period.startDate).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(report.period.endDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Gráfico de Receitas vs Despesas por Dia */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Receitas vs Despesas por Dia
                    </h3>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report.byDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="day"
                          stroke="#64748b"
                          fontSize={12}
                          tickFormatter={(day) => day.split("-")[2]}
                        />
                        <YAxis
                          stroke="#64748b"
                          fontSize={12}
                          tickFormatter={(value) => `R$ ${value / 100}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#fff" }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Receitas" fill="#10B981" />
                        <Bar dataKey="expense" name="Despesas" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico de Evolução do Saldo */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Evolução do Saldo (Dia)
                    </h3>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={report.byDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="day"
                          stroke="#64748b"
                          fontSize={12}
                          tickFormatter={(day) => day.split("-")[2]}
                        />
                        <YAxis
                          stroke="#64748b"
                          fontSize={12}
                          tickFormatter={(value) => `R$ ${value / 100}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#fff" }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="income"
                          name="Receitas Acumuladas"
                          stroke="#10B981"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="expense"
                          name="Despesas Acumuladas"
                          stroke="#EF4444"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top Categorias */}
              <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Top 5 Categorias de Despesas
                  </h3>
                </div>
                <div className="space-y-3">
                  {report.topCategories.map((cat: any, index: number) => (
                    <div
                      key={cat.categoryId}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                          {index + 1}
                        </div>
                        <span className="text-white font-medium">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {formatCurrency(cat.total)}
                        </p>
                        <p className="text-xs text-slate-400">{cat.count} transações</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}