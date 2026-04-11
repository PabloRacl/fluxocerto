"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Info,
  RefreshCw,
  Zap,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/biblioteca/http-client";
import { CarregamentoNeural } from "./CarregamentoNeural";
import { MascoteNeural } from "./MascoteNeural";

interface Insight {
  tipo: "positivo" | "alerta" | "info" | "dica";
  titulo: string;
  descricao: string;
  icone: string;
}

interface InsightData {
  score: number;
  status: string;
  insights: Insight[];
  mascotMood: "HAPPY" | "WORRIED";
}

const TIPO_STYLES: Record<string, {
  border: string; bg: string; icon: any; iconColor: string;
  iconBg: string; dot: string; label: string;
}> = {
  positivo: {
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/5",
    icon: TrendingUp,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
    dot: "bg-emerald-400",
    label: "Positivo",
  },
  alerta: {
    border: "border-red-500/25",
    bg: "bg-red-500/5",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    iconBg: "bg-red-500/15",
    dot: "bg-red-400",
    label: "Alerta",
  },
  info: {
    border: "border-blue-500/25",
    bg: "bg-blue-500/5",
    icon: Info,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15",
    dot: "bg-blue-400",
    label: "Info",
  },
  dica: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/5",
    icon: Lightbulb,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
    dot: "bg-amber-400",
    label: "Dica",
  },
};

export function PainelInsights({ userId, userLevel = 1 }: { userId: string; userLevel?: number }) {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.get<InsightData>("/api/painel/insights");
      setData(result);
    } catch (err) {
      console.error("Erro ao carregar insights:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  if (loading) return <CarregamentoNeural message="Sincronizando Insights Neurais..." variant="card" />;

  if (!data || data.insights.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 text-center opacity-40">
        <Sparkles className="w-6 h-6 text-slate-700 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Aguardando dados para diagnóstico financeiro...</p>
      </div>
    );
  }

  const healthColor = data.score > 70 ? "emerald" : data.score < 40 ? "red" : "amber";
  const mascotPhrase = data.score > 70
    ? "Tudo certo! Patrimônio em alta."
    : "Atenção! Reveja alguns pontos.";

  return (
    <div data-tour="insights" className="relative bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-slate-800/50 overflow-hidden">

      {/* ─── CABEÇALHO COMPACTO: Mascote + Frase + Score ─── */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5">
        {/* Mascote pequeno — igual ao flutuante de conquistas */}
        <div className="relative flex-shrink-0 w-14 h-14">
          <div className={`absolute inset-0 bg-${healthColor}-500/20 blur-xl rounded-full`} />
          <MascoteNeural
            mood={data.score > 70 ? "HAPPY" : "WORRIED"}
            size="sm"
            showScan={false}
            level={userLevel}
          />
        </div>

        {/* Frase + label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Insights Automáticos</span>
          </div>
          <p className={`text-sm font-bold text-white italic truncate`}>
            &quot;{mascotPhrase}&quot;
          </p>
        </div>

        {/* Score compacto */}
        <div className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl border bg-${healthColor}-500/10 border-${healthColor}-500/30`}>
          <span className={`text-lg font-black leading-none text-${healthColor}-400`}>{data.score}</span>
          <span className="text-[8px] font-bold text-slate-500 uppercase">pts</span>
        </div>

        {/* Botão sincronizar */}
        <button
          onClick={fetchInsights}
          title="Sincronizar"
          className="flex-shrink-0 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all group/sync"
        >
          <RefreshCw className="w-3.5 h-3.5 group-hover/sync:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* ─── LISTA DE INSIGHTS (foco principal) ─── */}
      <div className="p-4 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {data.insights.map((insight, i) => {
            const style = TIPO_STYLES[insight.tipo] || TIPO_STYLES.info;
            const Icon = style.icon;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ x: 3 }}
                className={`group flex items-start gap-3 p-3.5 rounded-2xl border ${style.border} ${style.bg} backdrop-blur-xl transition-all duration-300 cursor-default`}
              >
                {/* Ícone do tipo */}
                <div className={`flex-shrink-0 p-2 rounded-xl ${style.iconBg} mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${style.iconColor}`} />
                </div>

                {/* Conteúdo da mensagem */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg leading-none">{insight.icone}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${style.iconColor} opacity-70`}>{style.label}</span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest truncate">{insight.titulo}</span>
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed font-medium">
                    {insight.descricao}
                  </p>
                </div>

                {/* Dot indicador */}
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${style.dot} shadow-[0_0_6px_currentColor] opacity-70 group-hover:opacity-100 transition-opacity`} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ─── RODAPÉ ─── */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <div className="flex -space-x-1">
          {[1, 2, 3].map(id => (
            <div key={id} className="w-4 h-4 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center">
              <Zap className="w-2 h-2 text-amber-500 fill-amber-500" />
            </div>
          ))}
        </div>
        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
          {data.insights.length} análises neurais ativas
        </p>
      </div>
    </div>
  );
}
