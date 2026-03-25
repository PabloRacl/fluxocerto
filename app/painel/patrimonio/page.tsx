"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Landmark,
  Coins,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

interface ContaInfo {
  id: string;
  name: string;
  balance: number;
  color: string;
  icon: string | null;
}

interface AtivoTipo {
  tipo: string;
  contas: ContaInfo[];
  total: number;
}

interface PatrimonioData {
  ativos: AtivoTipo[];
  totalAtivos: number;
  passivos: {
    dividas: { total: number; quantidade: number };
    faturasCartao: { total: number; quantidade: number };
    total: number;
  };
  patrimonioLiquido: number;
  composicao: { tipo: string; valor: number; percentual: number }[];
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v / 100);
}

const CORES = [
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
];

const ICONES_TIPO: Record<string, any> = {
  "Conta Corrente": Wallet,
  Poupança: PiggyBank,
  Investimentos: TrendingUp,
  Dinheiro: Coins,
  PIX: Landmark,
  Outros: Wallet,
};

export default function PatrimonioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<PatrimonioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/painel/patrimonio", {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setData(d);
      setError("");
    } catch {
      setError("Erro ao carregar patrimônio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }
    if (status === "authenticated") fetchData();
  }, [status, router, fetchData]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PageHeader
        title="Patrimônio"
        subtitle="Ativos - Passivos = Patrimônio Líquido"
        onRefresh={fetchData}
        showDashboardLink
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-slate-800 rounded-xl h-32"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 bg-slate-900/50 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Total de Ativos
                  </span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">
                  {formatCurrency(data.totalAtivos)}
                </p>
              </div>

              <div className="p-6 bg-slate-900/50 rounded-xl border border-red-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Total de Passivos
                  </span>
                </div>
                <p className="text-3xl font-bold text-red-400">
                  {formatCurrency(data.passivos.total)}
                </p>
              </div>

              <div
                className={`p-6 bg-slate-900/50 rounded-xl border ${data.patrimonioLiquido >= 0 ? "border-blue-500/20" : "border-red-500/20"}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${data.patrimonioLiquido >= 0 ? "bg-blue-500/20" : "bg-red-500/20"} flex items-center justify-center`}
                  >
                    <Wallet
                      className={`w-5 h-5 ${data.patrimonioLiquido >= 0 ? "text-blue-400" : "text-red-400"}`}
                    />
                  </div>
                  <span className="text-sm text-slate-400">
                    Patrimônio Líquido
                  </span>
                </div>
                <p
                  className={`text-3xl font-bold ${data.patrimonioLiquido >= 0 ? "text-blue-400" : "text-red-400"}`}
                >
                  {formatCurrency(data.patrimonioLiquido)}
                </p>
              </div>
            </div>

            {/* Alerta se passivos > ativos */}
            {data.patrimonioLiquido < 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">
                  Seus passivos superam seus ativos. Foque em reduzir dívidas e
                  aumentar sua reserva.
                </p>
              </div>
            )}

            {/* Composição dos Ativos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Pizza */}
              {data.composicao.length > 0 && (
                <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">
                    Composição dos Ativos
                  </h3>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={data.composicao}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="valor"
                        >
                          {data.composicao.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CORES[index % CORES.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "Valor",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="flex-1 space-y-2 w-full">
                      {data.composicao.map((comp, i) => {
                        const Icon = ICONES_TIPO[comp.tipo] || Wallet;
                        return (
                          <div
                            key={comp.tipo}
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: CORES[i % CORES.length],
                                }}
                              />
                              <Icon className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-300">
                                {comp.tipo}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-white">
                                {formatCurrency(comp.valor)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {comp.percentual}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Detalhes dos Ativos */}
              <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">
                  Detalhamento dos Ativos
                </h3>
                <div className="space-y-4">
                  {data.ativos.map((ativo) => {
                    const Icon = ICONES_TIPO[ativo.tipo] || Wallet;
                    return (
                      <div
                        key={ativo.tipo}
                        className="p-4 bg-slate-800/50 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-medium text-white">
                              {ativo.tipo}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-emerald-400">
                            {formatCurrency(ativo.total)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {ativo.contas.map((conta) => (
                            <div
                              key={conta.id}
                              className="flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: conta.color }}
                                />
                                <span className="text-slate-400">
                                  {conta.icon} {conta.name}
                                </span>
                              </div>
                              <span className="text-slate-300">
                                {formatCurrency(conta.balance)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detalhes dos Passivos */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">
                Passivos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-slate-400">
                      Dívidas Pendentes
                    </span>
                  </div>
                  <p className="text-xl font-bold text-red-400">
                    {formatCurrency(data.passivos.dividas.total)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {data.passivos.dividas.quantidade} dívida(s) ativa(s)
                  </p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-slate-400">
                      Faturas de Cartão
                    </span>
                  </div>
                  <p className="text-xl font-bold text-orange-400">
                    {formatCurrency(data.passivos.faturasCartao.total)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {data.passivos.faturasCartao.quantidade} cartão(ões)
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
