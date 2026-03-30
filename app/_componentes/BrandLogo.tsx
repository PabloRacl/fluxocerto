"use client";

import { Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

// Novo Ícone de Escudo Neural Customizado (High-Fidelity)
function NeuralShieldIcon({ className }: { className: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Camada 1: Escudo Base (Metálico) */}
      <path 
        d="M50 5L15 20V45C15 65 35 85 50 95C65 85 85 65 85 45V20L50 5Z" 
        className="fill-slate-900 stroke-emerald-500/50"
        strokeWidth="2"
      />
      
      {/* Camada 2: Detalhes Internos do Escudo (Circuitos) */}
      <path 
        d="M30 30L50 15L70 30" 
        className="stroke-emerald-400/20"
        strokeWidth="1"
      />
      <path 
        d="M25 45H75" 
        className="stroke-emerald-400/10"
        strokeWidth="1"
      />
      
      {/* Camada 3: Sifrão ($) Central */}
      <text 
        x="50" y="58" 
        fontSize="30" 
        fontWeight="bold" 
        textAnchor="middle" 
        className="fill-emerald-400/80 select-none font-sans"
        style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.5))" }}
      >
        $
      </text>

      {/* Camada 4: Flecha de Crescimento Neon (Pulsante) */}
      <motion.path 
        d="M20 70L40 55L55 60L85 25M85 25H70M85 25V40" 
        className="stroke-emerald-400"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ 
          pathLength: [0.9, 1, 0.9],
          opacity: [0.7, 1, 0.7],
          filter: [
            "drop-shadow(0 0 5px rgba(16,185,129,0.8))", 
            "drop-shadow(0 0 15px rgba(16,185,129,1))",
            "drop-shadow(0 0 5px rgba(16,185,129,0.8))"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  );
}

export function BrandLogo({ 
  size = "md", 
  showText = true,
  className = "" 
}: BrandLogoProps) {
  
  // Mapeamento de tamanhos
  const sizes = {
    sm: { iconContainer: "w-9 h-9", icon: "w-7 h-7", text: "text-lg" },
    md: { iconContainer: "w-11 h-11", icon: "w-8 h-8", text: "text-xl" },
    lg: { iconContainer: "w-18 h-18", icon: "w-14 h-14", text: "text-3xl" },
    xl: { iconContainer: "w-28 h-28", icon: "w-20 h-20", text: "text-4xl" },
  };

  const S = sizes[size];

  // Animação de Heartbeat (Pulse Neural)
  // Ritmo 'Lub-Dub': sístole e diástole
  const heartbeatTransition = {
    duration: 1.5,
    repeat: Infinity,
    repeatDelay: 1, // Pausa entre batimentos
    ease: "easeInOut" as const,
  };

  const heartbeatAnimation = {
    scale: [1, 1.08, 1.03, 1.15, 1], // lub-dub
    opacity: [1, 0.9, 1, 0.8, 1],
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Container do Ícone com Glow Neural */}
      <div className="relative">
        {/* Glow de Fundo Pulsante (Coração Neural) */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1, 1.4, 1],
            opacity: [0.1, 0.3, 0.1, 0.4, 0.1],
          }}
          transition={heartbeatTransition}
          className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl opacity-20"
        />

        {/* Ícone com Batimento Cardíaco */}
        <motion.div
          animate={heartbeatAnimation}
          transition={heartbeatTransition}
          className={`${S.iconContainer} bg-slate-900 border border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] relative z-10 overflow-visible backdrop-blur-sm`}
        >
          <NeuralShieldIcon className={`${S.icon}`} />
          
          {/* Reflexo Cyber de Varredura */}
          <motion.div
            animate={{ y: ["-100%", "250%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" as const }}
            className="absolute inset-x-0 h-px bg-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.5)] z-20 pointer-events-none"
          />
        </motion.div>
      </div>

      {/* Texto Logo Neural */}
      {showText && (
        <div className="flex flex-col items-start leading-none">
          <motion.h1 
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              textShadow: ["0 0 10px rgba(16,185,129,0.2)", "0 0 20px rgba(16,185,129,0.5)", "0 0 10px rgba(16,185,129,0.2)"]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className={`${S.text} font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-[length:200%_auto] bg-clip-text text-transparent tracking-tighter drop-shadow-sm`}
          >
            FluxoCerto
          </motion.h1>
          {size === "lg" || size === "xl" ? (
             <motion.p 
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-[10px] uppercase font-bold tracking-[0.4em] text-emerald-500/80 mt-1 ml-0.5"
             >
               Inteligência Financeira
             </motion.p>
          ) : null}
        </div>
      )}
    </div>
  );
}
