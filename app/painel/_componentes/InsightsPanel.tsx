"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Info,
  RefreshCw,
} from "lucide-react";

interface Insight {
  tipo: "positivo" | "alerta" | "info" | "dica";
  titulo: string;
  descricao: string;
  icone: string;
}

const TIPO_STYLES: Record<
  string,
  { border: string; bg: string; icon: any; iconColor: string }
> = {
  positivo: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    icon: TrendingUp,
    iconColor: "text-emerald-400",
  },
  alerta: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    icon: AlertTriangle,
    iconColor: "text-red-400",
  },
  info: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    icon: Info,
    iconColor: "text-blue-400",
  },
  dica: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    icon: Lightbulb,
    iconColor: "text-amber-400",
  },
};

export function InsightsPanel({ userId }: { userId: string }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/painel/insights", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch (err) {
      console.error("Erro ao carregar insights:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">
            Insights Automáticos
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-slate-800 rounded-xl h-20"
            />
          ))}
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">
            Insights Automáticos
          </h3>
        </div>
        <button
          onClick={fetchInsights}
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          title="Atualizar insights"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, i) => {
          const style = TIPO_STYLES[insight.tipo] || TIPO_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-xl border ${style.border} ${style.bg} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-xl">{insight.icone}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${style.iconColor}`} />
                    <h4 className="text-sm font-semibold text-white truncate">
                      {insight.titulo}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {insight.descricao}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 mt-4 text-center">
        Insights baseados nos seus dados dos últimos períodos
      </p>
    </div>
  );
}
