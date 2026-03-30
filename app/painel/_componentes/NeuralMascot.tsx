"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";

interface NeuralMascotProps {
  mood?: "HAPPY" | "WORRIED" | "THINKING";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showScan?: boolean;
  level?: number;
  isSpeaking?: boolean;
  equippedItems?: number[];
  interactive?: boolean;
  onClick?: () => void;
}

export function NeuralMascot({ 
  mood = "HAPPY", 
  size = "md", 
  className = "",
  showScan = true,
  level = 1,
  isSpeaking = false,
  equippedItems,
  interactive = true,
  onClick
}: NeuralMascotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPoked, setIsPoked] = useState(false);

  // Parallax Mechanics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200, mass: 1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-15, 15]);
  const translateX = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  const translateY = useTransform(smoothY, [-0.5, 0.5], [-8, 8]);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate mouse position relative to center of the component (-0.5 to 0.5)
        const x = (e.clientX - rect.left - rect.width / 2) / (window.innerWidth / 2) * 0.5;
        const y = (e.clientY - rect.top - rect.height / 2) / (window.innerHeight / 2) * 0.5;
        mouseX.set(x);
        mouseY.set(y);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive, mouseX, mouseY]);

  const handlePoke = () => {
    if (onClick) onClick();
    if (!isPoked) {
      setIsPoked(true);
      setTimeout(() => setIsPoked(false), 2000);
    }
  };

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
    <div 
       ref={containerRef}
       className={`relative flex items-center justify-center ${className} ${interactive ? 'cursor-pointer' : ''}`} 
       style={{ width: sizePixels, height: sizePixels, perspective: 1000 }}
       onClick={interactive ? handlePoke : undefined}
    >
      
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

      {/* 2. Mascote 3D com Movimento Orgânico e Parallax */}
      <motion.div
        style={{ 
          rotateX: interactive ? rotateX : 0, 
          rotateY: interactive ? rotateY : 0,
          x: interactive ? translateX : 0,
          y: interactive ? translateY : 0,
          transformStyle: "preserve-3d"
        }}
        className="relative z-10 w-full h-full will-change-transform"
      >
        <motion.div
          animate={{ 
            y: isPoked ? [-20, 0, -10, 0] : [0, -6, 0],   // Poke salta
            rotate: isPoked ? [0, -15, 15, -5, 5, 0] : [-1, 1, -1], // Poked faz o mascote balançar e recuperar
            scale: isSpeaking ? [1, 1.05, 1, 1.05, 1] : (isPoked ? [1, 1.1, 1] : 1)
          }}
          transition={{ 
            y: isPoked ? { duration: 0.6 } : { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: isPoked ? { duration: 0.8 } : { duration: 5, repeat: Infinity, ease: "easeInOut" },
            scale: isSpeaking ? { duration: 0.8, repeat: Infinity } : (isPoked ? { duration: 0.6 } : { duration: 0 })
          }}
          className="relative w-full h-full"
        >
          {/* Efeito Respiratório Ocioso */}
          <motion.div
            animate={!isPoked && !isSpeaking ? {
              scaleY: [1, 1.03, 1], // Breathing chest expansion
            } : { scaleY: 1 }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             className="w-full h-full relative"
          >
            <Image 
              src={src}
              alt={`Mascote 3D ${mood}`}
              fill
              className="object-contain brightness-110 saturate-[1.1] drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
              priority
            />

        {/* --- INÍCIO DOS COSMÉTICOS --- */}
        {/* Lvl 5: Óculos de Sol */}
        {((equippedItems ? equippedItems.includes(5) : level >= 5)) && (
          <div className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] flex items-center justify-center leading-none" style={{ fontSize: sizePixels * 0.45 }}>
             🕶️
          </div>
        )}
        {/* Lvl 10: Gravata Social */}
        {((equippedItems ? equippedItems.includes(10) : level >= 10)) && (
          <div className="absolute top-[68%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-20 drop-shadow-md flex items-center justify-center leading-none" style={{ fontSize: sizePixels * 0.35 }}>
             👔
          </div>
        )}
        {/* Lvl 15: Cordão de Ouro Ostentação */}
        {((equippedItems ? equippedItems.includes(15) : level >= 15)) && (
          <div className="absolute top-[72%] left-[49%] -translate-x-1/2 -translate-y-1/2 z-30 drop-shadow-xl flex items-center justify-center leading-none" style={{ fontSize: sizePixels * 0.3 }}>
             🏅
          </div>
        )}
        {/* Lvl 20: Relógio de Luxo  */}
        {((equippedItems ? equippedItems.includes(20) : level >= 20)) && (
          <div className="absolute top-[52%] left-[82%] -translate-x-1/2 -translate-y-1/2 z-30 drop-shadow-md flex items-center justify-center leading-none" style={{ fontSize: sizePixels * 0.25, transform: 'translate(-50%, -50%) rotate(20deg)' }}>
             ⌚
          </div>
        )}
        {/* Lvl 25: Chapéu de Cartola (Substituído pela Coroa no 30) */}
        {((equippedItems ? equippedItems.includes(25) : level >= 25 && level < 30)) && (
          <div className="absolute top-[8%] left-[50%] -translate-x-[40%] -translate-y-1/2 z-30 drop-shadow-xl flex items-center justify-center leading-none" style={{ fontSize: sizePixels * 0.5, transform: 'translate(-40%, -50%) rotate(10deg)' }}>
             🎩
          </div>
        )}
        {/* Lvl 30: Coroa de Mestre */}
        {((equippedItems ? equippedItems.includes(30) : level >= 30)) && (
          <div className="absolute top-[8%] left-[50%] -translate-x-[40%] -translate-y-1/2 z-30 drop-shadow-2xl flex items-center justify-center leading-none" style={{ fontSize: sizePixels * 0.5, transform: 'translate(-40%, -50%) rotate(15deg)' }}>
             👑
          </div>
        )}
        {/* Lvl 35: Diamante Brilhante */}
        {((equippedItems ? equippedItems.includes(35) : level >= 35)) && (
           <motion.div 
             animate={{ y: [-5, 5, -5] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-[25%] left-[18%] -translate-x-1/2 -translate-y-1/2 z-30 drop-shadow-[0_0_15px_rgba(167,139,250,0.8)] flex items-center justify-center leading-none" 
             style={{ fontSize: sizePixels * 0.3, transform: 'translate(-50%, -50%)' }}
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
        </motion.div>
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
