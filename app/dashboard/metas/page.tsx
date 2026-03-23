"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Target,
  Plus,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function GoalsPage() {
  const { status } = useSession();
  const router = useRouter();
  
  // Dados mockados para demonstração
  const [goals] = useState([
    {
      id: "1",
      name: "Reserva de Emergência",
      target: 1000000, // em centavos = R$ 10.000
      current: 650000,
      deadline: "2026-12-31",
      category: "SAVINGS",
    },
    {
      id: "2",
      name: "Viagem de Férias",
      target: 500000,
      current: 180000,
      deadline: "2026-07-01",
      category: "TRAVEL",
    },
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const getProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
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
                <h1 className="text-xl font-bold text-white">Metas Financeiras</h1>
                <p className="text-sm text-slate-400">Acompanhe e alcance seus objetivos</p>
              </div>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Nova Meta
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Metas Ativas</span>
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-white">{goals.length}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total Economizado</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(goals.reduce((sum, g) => sum + g.current, 0))}
            </p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Falta para Concluir</span>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {formatCurrency(goals.reduce((sum, g) => sum + (g.target - g.current), 0))}
            </p>
          </div>
        </div>

        {/* Lista de Metas */}
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = getProgress(goal.current, goal.target);
            return (
              <div
                key={goal.id}
                className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{goal.name}</h3>
                    <p className="text-sm text-slate-400">
                      Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {progress >= 100 ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
                      {progress}% concluído
                    </span>
                  )}
                </div>

                {/* Barra de Progresso */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">{formatCurrency(goal.current)}</span>
                    <span className="text-slate-400">{formatCurrency(goal.target)}</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                    Editar
                  </button>
                  <button className="px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors">
                    Adicionar Valor
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA para nova meta */}
        {goals.length === 0 && (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma meta cadastrada</h3>
            <p className="text-slate-400 mb-6">Comece definindo seu primeiro objetivo financeiro</p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors">
              <Plus className="w-5 h-5" /> Criar Primeira Meta
            </button>
          </div>
        )}
      </main>
    </div>
  );
}