"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Trophy, 
  Flame, 
  Star, 
  Award, 
  ChevronUp, 
  ChevronDown, 
  Zap,
  LayoutDashboard,
  Info,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/biblioteca/http-client";
import { MascotInventory } from "./MascotInventory";
import { ShoppingBag } from "lucide-react";

interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  conquistado: boolean;
  progresso: number;
}

interface GamificacaoData {
  nivel: {
    nivel: number;
    nome: string;
    icone: string;
    xpAtual: number;
    progressoNivel: number;
  };
  streak: number;
  badges: Badge[];
  resumo: {
    totalBadges: number;
    badgesConquistados: number;
    totalTransacoes: number;
    metasConcluidas: number;
    dividasQuitadas: number;
  };
}

export function FloatingGamification() {
  const [data, setData] = useState<GamificacaoData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sistema de Partículas Orbitais (Cálculo Otimizado)
  const particles = useMemo(() => Array.from({ length: 4 }).map((_, i) => ({
    id: i,
    delay: i * 0.8,
    duration: 3 + i,
    radius: 28 + i * 4
  })), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const d = await api.get<GamificacaoData>("/api/painel/gamificacao");
        setData(d);
      } catch (err) {
        console.error("Erro gamificacao:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
      
      {/* 🔮 Drawer de Conquistas (Holographic Slate) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, y: 30, filter: "blur(10px)" }}
            className="pointer-events-auto w-[340px] bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
          >
            {/* Efeitos de Luz Interna do Drawer */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">Status Neural</span>
                  <h4 className="text-xl font-black text-white flex items-center gap-2">
                    Conquistas
                  </h4>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                      <span className="text-xs font-black text-emerald-400">LVL {data.nivel.nivel}</span>
                   </div>
                </div>
              </div>

              {/* Barra de XP HUD */}
              <div className="mb-6 p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Sincronização Neural</span>
                    <span className="text-[10px] text-emerald-400 font-black tracking-widest">{data.nivel.progressoNivel}%</span>
                 </div>
                 <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-[1.5px]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${data.nivel.progressoNivel}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    />
                 </div>
                  <p className="text-[9px] text-slate-500 mt-2 font-medium">Projetado para Nível {data.nivel.nivel + 1} em <span className="text-slate-300">{200 - data.nivel.xpAtual} XP</span></p>
               </div>

               {/* Ação: Abrir Inventário */}
               <button
                 onClick={() => { setIsInventoryOpen(true); setIsOpen(false); }}
                 className="w-full flex items-center justify-between p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group"
               >
                 <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                       <span className="text-xs font-black text-emerald-100 uppercase block">Inventário Neural</span>
                       <span className="text-[10px] text-emerald-400 font-medium italic">Equipar e evoluir visual</span>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
               </button>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {data.badges.map((badge, idx) => (
                  <motion.div 
                    key={badge.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group/badge flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      badge.conquistado 
                      ? "bg-amber-500/5 border-amber-500/20" 
                      : "bg-slate-900/40 border-slate-800/50 opacity-50 grayscale"
                    }`}
                  >
                    {/* Glow específico para conquistado */}
                    {badge.conquistado && (
                       <div className="absolute -right-4 -top-4 w-12 h-12 bg-amber-500/10 blur-xl group-hover/badge:opacity-40 transition-opacity" />
                    )}

                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-slate-950/80 border border-white/5 shadow-inner`}>
                      {badge.icone}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-black tracking-tight ${badge.conquistado ? 'text-amber-100' : 'text-slate-400'} transition-colors`}>
                        {badge.nome}
                      </p>
                      <p className="text-[9px] text-slate-500 font-medium leading-tight line-clamp-1 italic">
                        {badge.descricao}
                      </p>
                    </div>

                    <div className="flex items-center">
                       {badge.conquistado ? (
                          <div className="relative">
                             <div className="absolute inset-0 bg-amber-400 blur-md opacity-30 animate-pulse" />
                             <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 relative z-10" />
                          </div>
                       ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                       )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 O Pulsar: Bolha Principal de Gamificação */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto relative group flex items-center justify-center"
      >
        {/* 1. Aura de Respiração Neural (Pulse) */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-40 group-hover:opacity-100 animate-[pulse_3s_ease-in-out_infinite]" />
        
        {/* 2. Partículas Orbitais (Neural Fragments) */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-1 h-1 bg-emerald-400/60 rounded-full blur-[1px]"
            animate={{
              rotate: 360,
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              rotate: { duration: p.duration, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, delay: p.delay },
              opacity: { duration: 2, repeat: Infinity, delay: p.delay },
            }}
            style={{
              x: p.radius,
            }}
          />
        ))}

        {/* 3. Container da Cápsula (HUD Design) */}
        <div className="relative flex items-center gap-4 bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-2.5 pl-5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:border-emerald-500/50 group-hover:bg-slate-950/90">
          
          <div className="flex flex-col items-start min-w-[45px]">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Neural</span>
            <div className="flex items-baseline gap-0.5">
               <span className="text-lg font-black text-white leading-none">LV. {data.nivel.nivel}</span>
            </div>
          </div>

          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* SVG da Barra de Progresso Líquido */}
            <svg className="w-full h-full transform -rotate-90">
               {/* Sombra da trilha */}
              <circle
                cx="24" cy="24" r="21"
                stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent"
              />
              {/* Barra Principal Metálica */}
              <motion.circle
                cx="24" cy="24" r="21"
                stroke="url(#neuralGradient)"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="132"
                strokeDashoffset={132 - (132 * data.nivel.progressoNivel) / 100}
                className="stroke-linecap-round filter drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
              />
              <defs>
                <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center text-xl bg-slate-950/50 rounded-full border border-white/5 m-1.5 shadow-inner group-hover:scale-110 transition-transform duration-500">
               <span className="drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{data.nivel.icone}</span>
            </div>
          </div>

          {data.resumo && data.resumo.badgesConquistados > 0 && (
             <div className="relative flex items-center justify-center mr-2">
                {/* Efeito de Brilho Dourado */}
                <motion.div 
                   animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                   transition={{ duration: 0.8, repeat: Infinity }}
                   className="absolute inset-0 bg-amber-500 blur-md rounded-full pointer-events-none"
                />
                <div className="relative flex items-center gap-1.5 bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-amber-100">{data.resumo.badgesConquistados}</span>
                </div>
             </div>
          )}

          {/* Seta de Interação HUD */}
          <div className="ml-1 opacity-40 group-hover:opacity-100 transition-opacity">
             <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
          </div>
        </div>
      </motion.button>

      {/* MODAL DO INVENTÁRIO NEURAL */}
      <MascotInventory 
        isOpen={isInventoryOpen} 
        onClose={() => setIsInventoryOpen(false)} 
        level={data.nivel.nivel}
      />
    </div>
  );
}
