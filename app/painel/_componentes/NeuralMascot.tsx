"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface NeuralMascotProps {
  mood?: "HAPPY" | "WORRIED" | "THINKING";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showScan?: boolean;
  level?: number;
  isSpeaking?: boolean;
}

export function NeuralMascot({ 
  mood = "HAPPY", 
  size = "md", 
  className = "",
  showScan = true,
  level = 1,
  isSpeaking = false
}: NeuralMascotProps) {
  const src = mood === "WORRIED" 
    ? "/mascote/sapo_preocupado_dark.png" 
    : "/mascote/sapo_feliz_dark.png";

  const sizePixels = {
    sm: 60,
    md: 100,
    lg: 160,
    xl: 240
  }[size];

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: sizePixels, height: sizePixels }}>
      
      {/* 1. Aura de Energia Neural ou Aura Mestre (Lvl 40+ e 50+) */}
      {level >= 50 ? (
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5], rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-40%] rounded-full blur-3xl pointer-events-none bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400"
        />
      ) : level >= 40 ? (
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3], rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-20%] rounded-full blur-2xl pointer-events-none bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300"
        />
      ) : (
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-0 rounded-full blur-3xl pointer-events-none ${mood === 'WORRIED' ? 'bg-red-500' : 'bg-emerald-500'}`}
        />
      )}

      {/* 2. Mascote 3D com Movimento Orgânico */}
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [-1, 1, -1],
          scale: isSpeaking ? [1, 1.05, 1, 1.05, 1] : 1
        }}
        transition={{ 
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          scale: isSpeaking ? { duration: 0.5, repeat: Infinity } : { duration: 0 }
        }}
        className="relative z-10 w-full h-full"
      >
        <Image 
          src={src}
          alt={`Mascote 3D ${mood}`}
          fill
          className="object-contain brightness-110 saturate-[1.1] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
          priority
        />

        {/* --- INÍCIO DOS COSMÉTICOS (Plano de Evolução: 10 Níveis a cada 5) --- */}
        {/* Lvl 5: Óculos de Sol */}
        {level >= 5 && (
          <div className="absolute top-[32%] left-[49%] -translate-x-1/2 -translate-y-1/2 z-30 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]" style={{ fontSize: sizePixels * 0.45 }}>
             🕶️
          </div>
        )}
        {/* Lvl 10: Gravata Social */}
        {level >= 10 && (
          <div className="absolute top-[65%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-20 drop-shadow-md" style={{ fontSize: sizePixels * 0.35 }}>
             👔
          </div>
        )}
        {/* Lvl 15: Cordão de Ouro Ostentação */}
        {level >= 15 && (
          <div className="absolute top-[67%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 drop-shadow-xl" style={{ fontSize: sizePixels * 0.3 }}>
             🏅
          </div>
        )}
        {/* Lvl 20: Relógio de Luxo  */}
        {level >= 20 && (
          <div className="absolute top-[50%] left-[80%] -translate-x-1/2 -translate-y-1/2 z-30 drop-shadow-md" style={{ fontSize: sizePixels * 0.25, transform: 'rotate(20deg)' }}>
             ⌚
          </div>
        )}
        {/* Lvl 25: Chapéu de Cartola (Substituído pela Coroa no 30) */}
        {level >= 25 && level < 30 && (
          <div className="absolute top-[5%] left-[50%] -translate-x-[40%] -translate-y-1/2 z-30 drop-shadow-xl" style={{ fontSize: sizePixels * 0.5, transform: 'rotate(10deg)' }}>
             🎩
          </div>
        )}
        {/* Lvl 30: Coroa de Mestre */}
        {level >= 30 && (
          <div className="absolute top-[3%] left-[50%] -translate-x-[40%] -translate-y-1/2 z-30 drop-shadow-2xl" style={{ fontSize: sizePixels * 0.5, transform: 'rotate(15deg)' }}>
             👑
          </div>
        )}
        {/* Lvl 35: Diamante Brilhante */}
        {level >= 35 && (
           <motion.div 
             animate={{ y: [-5, 5, -5] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-[20%] left-[15%] -translate-x-1/2 -translate-y-1/2 z-30 drop-shadow-[0_0_15px_rgba(167,139,250,0.8)]" 
             style={{ fontSize: sizePixels * 0.3 }}
           >
             💎
           </motion.div>
        )}
        {/* Lvl 40: Aura de Super Sayajin tratada no background */}
        {/* --- FIM DOS COSMÉTICOS --- */}

        {/* 3. Neural Scanning HUD (Linha Laser) */}
        {showScan && (
          <motion.div 
            initial={{ top: "10%" }}
            animate={{ top: "90%" }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={`absolute left-0 right-0 h-[1.5px] z-20 pointer-events-none blur-[1px] opacity-60 ${mood === 'WORRIED' ? 'bg-red-400 shadow-[0_0_10px_#f87171]' : 'bg-emerald-400 shadow-[0_0_10px_#34d399]'}`}
          />
        )}
      </motion.div>

      {/* 4. Partículas Orbitais (Neural Fragments ou Dinheiro/Estrelas) */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
         {[...Array(level >= 45 ? 7 : 3)].map((_, i) => (
           <motion.div
             key={i}
             className={
               level >= 45 
                 ? `absolute text-green-400 font-bold drop-shadow-sm` 
                 : `absolute w-1 h-1 rounded-full ${mood === 'WORRIED' ? 'bg-red-400' : 'bg-emerald-400'}`
             }
             animate={level >= 45 ? {
               y: [Math.random() * -20, sizePixels * 1.5],
               x: [0, Math.sin(i * 2) * 80, 0],
               opacity: [0, 1, 0],
               rotate: [0, 180, 360]
             } : {
               rotate: 360,
               opacity: [0, 0.8, 0],
               scale: [0, 1, 0]
             }}
             transition={{
               duration: level >= 45 ? 2 + Math.random() * 2 : 4 + i,
               repeat: Infinity,
               delay: i * (level >= 45 ? 0.3 : 1.5),
               ease: "linear"
             }}
             style={level >= 45 ? {
               left: `${10 + i * 12}%`,
               top: "-20%",
               fontSize: sizePixels * (level >= 50 && i % 2 === 0 ? 0.25 : 0.2)
             } : {
               left: "50%",
               top: "50%",
               transformOrigin: `${30 + i * 10}px 0`
             }}
           >
             {level >= 50 && i % 2 === 0 ? "🌟" : level >= 45 ? "💸" : ""}
           </motion.div>
         ))}
      </div>
    </div>
  );
}
