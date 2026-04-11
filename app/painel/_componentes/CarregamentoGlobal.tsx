"use client";

import { motion } from "framer-motion";
import { LogoMarca } from "@/app/_componentes/LogoMarca";

export function CarregamentoGlobal() {
  return (
    <div className="fixed inset-0 min-h-screen bg-slate-950 z-[100] flex flex-col items-center justify-center overflow-hidden">
      {/* Glowing Orb Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />

      {/* 3D Infinity Rings Animation */}
      <div className="relative w-32 h-32 mb-8 flex items-center justify-center perspective-1000">
        {/* Ring 1 - Eixo Z */}
        <motion.div
           className="absolute inset-0 rounded-full border-t-4 border-r-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
           animate={{ rotate: 360, scale: [1, 1.1, 1] }}
           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        {/* Ring 2 - Inverso */}
        <motion.div
           className="absolute inset-2 rounded-full border-b-4 border-l-2 border-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.5)]"
           animate={{ rotate: -360, scale: [1, 1.2, 1] }}
           transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        {/* Ring 3 - Rotação X para 3D Effect */}
        <motion.div
           className="absolute inset-4 rounded-full border-t-4 border-l-2 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
           animate={{ rotate: 360, rotateX: [0, 180, 360] }}
           transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        {/* Central Logo Hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 rounded-full backdrop-blur-[2px] shadow-inner">
          <LogoMarca size="md" showText={false} />
        </div>
      </div>

      <motion.div 
        className="flex flex-col items-center mt-2 relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <LogoMarca size="lg" showText className="mb-2" />
        <motion.p 
          className="text-emerald-400 text-sm font-semibold tracking-[0.2em] relative"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" as const }}
        >
          Sincronizando Dados...
        </motion.p>
      </motion.div>
    </div>
  );
}
