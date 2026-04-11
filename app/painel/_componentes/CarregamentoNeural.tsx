"use client";

import { motion } from "framer-motion";

interface NeuralLoadingProps {
  message?: string;
  variant?: "full" | "card" | "inline";
  showText?: boolean;
  className?: string;
}

export function CarregamentoNeural({ 
  message = "Sincronizando Insights Neurais...", 
  variant = "card",
  showText = true,
  className = ""
}: NeuralLoadingProps) {
  
  // Estilos base por variante
  const containerStyles = {
    full: "fixed inset-0 min-h-screen bg-slate-950 z-[100] flex flex-col items-center justify-center",
    card: "bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-8 min-h-[300px] flex flex-col items-center justify-center",
    inline: "flex items-center justify-center gap-3",
  };

  const orbSize = {
    full: "w-32 h-32",
    card: "w-20 h-20",
    inline: "w-6 h-6",
  };

  return (
    <div className={`${containerStyles[variant]} ${className}`}>
      {/* Orb de Energia Neural */}
      <div className={`relative ${orbSize[variant]} ${variant !== 'inline' ? 'mb-6' : ''}`}>
        <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping opacity-40" />
        <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-[25%] bg-emerald-500/20 rounded-full blur-[2px]"
        />
      </div>

      {/* Texto de Status Neural */}
      {showText && (
        <div className={variant === 'inline' ? "text-left" : "text-center space-y-2"}>
          {variant !== 'inline' && (
            <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
              Neural Process Active
            </p>
          )}
          <h3 className={`text-slate-300 font-bold ${variant === 'full' ? 'text-lg' : 'text-xs'} uppercase tracking-widest`}>
            {message}
          </h3>
          
          {variant !== 'inline' && (
            <div className="w-32 h-0.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
              <motion.div 
                animate={{ x: [-40, 128] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-10 h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
