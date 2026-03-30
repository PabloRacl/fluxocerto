"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Info,
  RefreshCw,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { api } from "@/biblioteca/http-client";
import { NeuralLoading } from "./NeuralLoading";
import { NeuralMascot } from "./NeuralMascot";

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

const TIPO_STYLES: Record<
  string,
  { border: string; bg: string; icon: any; iconColor: string; iconBg: string; shadow: string }
> = {
  positivo: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    icon: TrendingUp,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400",
    shadow: "shadow-[0_0_20px_rgba(16,185,129,0.1)]",
  },
  alerta: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    iconBg: "bg-red-400",
    shadow: "shadow-[0_0_20px_rgba(239,68,68,0.1)]",
  },
  info: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    icon: Info,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400",
    shadow: "shadow-[0_0_20px_rgba(59,130,246,0.1)]",
  },
  dica: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    icon: Lightbulb,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400",
    shadow: "shadow-[0_0_20px_rgba(245,158,11,0.1)]",
  },
};

export function InsightsPanel({ userId, userLevel = 1 }: { userId: string; userLevel?: number }) {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return <NeuralLoading message="Sincronizando Insights Neurais..." variant="card" />;
  }

  if (!data || data.insights.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-8 text-center opacity-40">
        <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Aguardando dados para diagnóstico financeiro...</p>
      </div>
    );
  }

  // Cor baseada na saúde
  const healthColor = data.score > 70 ? "emerald" : data.score < 40 ? "red" : "amber";

  return (
    <div ref={containerRef} className="relative bg-slate-950/40 backdrop-blur-2xl rounded-3xl border border-slate-800/50 p-6 overflow-hidden">
      
      {/* HUD de Saúde - Estilo Futurista */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 relative z-10 px-2">
        <div className="flex items-center gap-6">
          {/* Orbe Central (Neural Core) */}
          <motion.div 
            animate={{ scale: [1, 1.05, 1], rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className={`relative w-28 h-28 rounded-full border-4 border-dashed border-${healthColor}-500/30 p-2`}
          >
            <div className={`absolute inset-0 bg-${healthColor}-500/10 blur-2xl rounded-full`} />
            <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Health</span>
               <span className={`text-4xl font-black text-${healthColor}-400 leading-none`}>{data.score}</span>
               <div className={`absolute bottom-0 w-full h-1 bg-${healthColor}-500 opacity-40`} />
            </div>
          </motion.div>

          <div>
             <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Insights Automáticos</h3>
             </div>
             <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 bg-${healthColor}-500/10 text-${healthColor}-400 text-[10px] font-black rounded-full border border-${healthColor}-500/20 uppercase tracking-widest`}>
                  Status {data.status}
                </span>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Neural Analysis Active
                </span>
             </div>
          </div>
        </div>

        {/* Mascote Mentor 3D - Reativo (Animado e Holográfico) */}
        <div className="flex items-center gap-6 bg-slate-900/60 p-4 pr-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group/mascot min-w-[320px]">
          {/* Sombras de Glow HUD */}
          <div className="absolute inset-0 bg-emerald-500/5 blur-3xl pointer-events-none group-hover/mascot:opacity-60 transition-opacity" />
          
          <div className="relative z-20 -my-4 -ml-4">
             <NeuralMascot 
               mood={data.score > 70 ? "HAPPY" : "WORRIED"} 
               size="lg" 
               showScan={true}
               level={userLevel}
             />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1.5 opacity-60">
               <Zap className="w-3 h-3 text-emerald-400" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Neural Mentor</p>
            </div>
            <p className="text-base font-bold text-white italic max-w-[200px] leading-tight group-hover:text-emerald-100 transition-colors">
              "{data.score > 70 
                ? "Estamos indo muito bem! Seu patrimônio está crescendo." 
                : "Atenção aqui, humano! Preciso que você reveja uns pontos."}"
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {data.insights.map((insight, i) => {
            const style = TIPO_STYLES[insight.tipo] || TIPO_STYLES.info;
            const Icon = style.icon;
            // Simular impacto para os dots (exemplo: positivo=5, alerta=4, info=2, dica=3)
            const impactNodes = insight.tipo === "positivo" ? 5 : insight.tipo === "alerta" ? 4 : insight.tipo === "dica" ? 3 : 2;

            return (
              <motion.div
                key={i}
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -3 }}
                className={`group relative p-4 rounded-2xl border ${style.border} bg-slate-900/40 backdrop-blur-xl transition-all duration-500 overflow-hidden`}
              >
                {/* Efeito de Vidro e Brilho Interno */}
                <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 pointer-events-none transition-opacity group-hover:opacity-30 ${style.iconBg}`} />
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-white/5 blur-lg rounded-full animate-pulse" />
                    <span className="text-3xl relative z-10 block transform-gpu group-hover:scale-110 transition-transform">{insight.icone}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                       <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${style.iconColor} bg-slate-950/50 border border-white/5`}>
                             <Icon className="w-3 h-3" />
                          </div>
                          <h4 className="text-xs font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                            {insight.titulo}
                          </h4>
                       </div>
                       
                       {/* Neural Pulse Dots (Indicador de Impacto) */}
                       <div className="flex gap-1">
                         {[1, 2, 3, 4, 5].map((dot) => (
                           <div 
                             key={dot} 
                             className={`w-1 h-1 rounded-full transition-all duration-700 ${
                               dot <= impactNodes 
                               ? `${style.iconBg} shadow-[0_0_5px_currentColor]` 
                               : "bg-slate-800"
                             }`} 
                           />
                         ))}
                       </div>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-2 italic">
                     "{insight.descricao}"
                    </p>
                  </div>
                </div>

                {/* Shimmer Effect ao Hover */}
                <motion.div 
                   className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                   style={{ skewX: -20 }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="flex -space-x-2">
                {[1, 2, 3].map(id => (
                   <div key={id} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                      <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                   </div>
                ))}
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Análise baseada em {data.insights.length} redes neurais ativas
             </p>
          </div>
          
          <button
            onClick={fetchInsights}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-black rounded-full border border-white/5 transition-all active:scale-95 group"
          >
            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
            SINCROZINAR REDE
          </button>
      </div>
    </div>
  );
}
