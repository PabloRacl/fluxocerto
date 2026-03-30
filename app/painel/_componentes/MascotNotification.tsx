"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star } from "lucide-react";
import Image from "next/image";

interface Achievement {
  id: string;
  nome: string;
  icone: string;
}

export function MascotNotification({ data }: { data: any }) {
  const [show, setShow] = useState(false);
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [lastBadgesCount, setLastBadgesCount] = useState<number>(0);

  // Monitorar novas conquistas
  useEffect(() => {
    if (!data || !data.badges) return;

    const conquered = data.badges.filter((b: any) => b.conquistado);
    
    // Se o número de conquistas aumentou, mostramos a última conquistada
    if (lastBadgesCount > 0 && conquered.length > lastBadgesCount) {
      const lastOne = conquered[conquered.length - 1];
      setAchievement({
        id: lastOne.id,
        nome: lastOne.nome,
        icone: lastOne.icone
      });
      setShow(true);

      // Auto-ocultar após 6 segundos
      const timer = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(timer);
    }

    setLastBadgesCount(conquered.length);
  }, [data, lastBadgesCount]);

  return (
    <AnimatePresence>
      {show && achievement && (
        <motion.div
          initial={{ y: -100, x: "-50%", opacity: 0 }}
          animate={{ y: 20, x: "-50%", opacity: 1 }}
          exit={{ y: -100, x: "-50%", opacity: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="fixed top-0 left-1/2 z-[9999] w-[90%] max-w-md"
        >
          {/* Bolha de Conquista Estilo Jogo */}
          <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-4 shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden">
            
            {/* Glow de Fundo */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full" />
            
            <div className="flex items-center gap-5 relative z-10">
              {/* Mascote Animado */}
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, 0, -5, 0] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative w-20 h-20 flex-shrink-0"
              >
                <Image 
                  src="/mascote/sapo_feliz_transparente.png" 
                  alt="Sapo Feliz" 
                  fill
                  className="object-contain mix-blend-screen brightness-125 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                />
              </motion.div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Nova Conquista Alcançada!
                  </span>
                </div>
                <h4 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">
                  {achievement.nome}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <div className="px-2 py-0.5 bg-white/10 rounded-full flex items-center gap-1 border border-white/5">
                    <span className="text-lg">{achievement.icone}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    +100 XP RECOMPENSA
                  </span>
                </div>
              </div>
            </div>

            {/* Partículas de Brilho (Barra Inferior) */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
