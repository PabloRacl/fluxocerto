"use client";

import { useState, useEffect } from "react";
import { Wallet, LogOut, Trophy, Settings as SettingsIcon, Volume2, VolumeX } from "lucide-react";
import { neuralVoice } from "@/biblioteca/NeuralVoiceService";
import Link from "next/link";
import { financialTips } from "@/app/painel/_constants/financial-tips";
import { NotificationCenter } from "./NotificationCenter";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/app/_componentes/BrandLogo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/componentes/ui/tooltip";

interface DashboardHeaderProps {
  user: { name?: string | null; email?: string | null } | undefined;
  onSignOut: () => void;
}

export function DashboardHeader({ user, onSignOut }: DashboardHeaderProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(neuralVoice.getMuted());
  }, []);

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    neuralVoice.setMuted(newState);
  };

  // Rotação de dicas financeiras a cada 7 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % financialTips.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const currentTip = financialTips[currentTipIndex];
  const TipIcon = currentTip.icon;

  return (
    <header className="w-full p-4 border-b border-emerald-500/20 bg-slate-950/50 backdrop-blur-sm relative z-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo + Usuário */}
          <div className="flex items-center gap-3 flex-shrink-0 w-full lg:w-auto">
            <BrandLogo size="md" />
            <div className="hidden sm:block ml-1">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                Bem-vindo, <span className="text-emerald-400 font-black">{user?.name?.split(" ")[0] || "Usuário"}</span>
              </p>
            </div>
          </div>

          {/* Oráculo Neural de Dicas */}
          <div className="flex-1 w-full max-w-2xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            
            <div className="relative flex flex-col items-center bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3 sm:p-4 overflow-hidden shadow-2xl min-h-[70px] sm:min-h-[90px] justify-center">
              
              {/* Brilho Neural Dinâmico de Fundo */}
              <motion.div 
                key={`glow-${currentTipIndex}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.15, scale: 1.2 }}
                transition={{ duration: 1.5 }}
                className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
                    currentTip.color === "text-amber-400" ? "bg-amber-500" :
                    currentTip.color === "text-red-400" ? "bg-red-500" : "bg-emerald-500"
                }`}
              />

              <div className="relative z-10 w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTipIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex items-center gap-4"
                  >
                    {/* Ícone com Aura */}
                    <div className="relative flex-shrink-0">
                        <div className={`absolute inset-0 blur-lg opacity-40 animate-pulse ${currentTip.color.replace('text-', 'bg-')}`} />
                        <div className={`relative p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 shadow-inner ${currentTip.color}`}>
                            <TipIcon className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase tracking-[0.2em] font-black opacity-50 ${currentTip.color}`}>
                          Insight Neural
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
                      </div>
                      
                      <h3 className="text-sm font-bold text-white mb-0.5 tracking-tight truncate">
                        {currentTip.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                        "{currentTip.content}"
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Paginação Estilo Neurônios Conectados */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
                {financialTips.slice(0, 5).map((_, index) => (
                    <button
                    key={index}
                    onClick={() => setCurrentTipIndex(index)}
                    className="group relative flex items-center justify-center w-4 h-4"
                    aria-label={`Ver insight ${index + 1}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                            index === currentTipIndex % 5 
                            ? `scale-150 ${currentTip.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]` 
                            : "bg-slate-700 group-hover:bg-slate-500 shadow-none"
                        }`} />
                        {index === currentTipIndex % 5 && (
                             <motion.div 
                                layoutId="neuron-active"
                                className={`absolute inset-0 rounded-full border border-emerald-500/30`}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                             />
                        )}
                    </button>
                ))}
              </div>

            </div>
          </div>

          {/* Grupo de Ações - Layout Neural Unificado */}
          <div className="flex items-center gap-3 flex-shrink-0 w-full lg:w-auto justify-end">
            
            <TooltipProvider>
              {/* Conquistas (Troféu Dourado Brilhante) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/painel/conquistas">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative p-2.5 bg-slate-900 border border-amber-500/30 rounded-xl transition-all hover:border-amber-500/60 overflow-hidden"
                    >
                      {/* Efeito Glow Interno Pulsante */}
                      <motion.div 
                        animate={{ opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-amber-500 blur-xl"
                      />
                      
                      <Trophy className="w-5 h-5 text-amber-500 relative z-10 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                      
                      {/* Shine Effect */}
                      <motion.div
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-20"
                      />
                    </motion.div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white">Minhas Conquistas</TooltipContent>
              </Tooltip>

              {/* Central de Notificações / Lembretes */}
              <NotificationCenter />

              {/* Toggle de Áudio Neural */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleMute}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isMuted 
                        ? "bg-red-500/10 border-red-500/30 text-red-400 hover:border-red-500/60" 
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60"
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white">
                  {isMuted ? "Ativar Guia de Áudio" : "Silenciar Guia de Áudio"}
                </TooltipContent>
              </Tooltip>

              <div className="w-px h-8 bg-slate-800 mx-1" /> {/* Divisor Neural */}

              {/* Configurações (Giro Cinético no Hover) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/painel/configuracoes">
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="p-2.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all hover:border-slate-700"
                    >
                      <SettingsIcon className="w-5 h-5" />
                    </motion.div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white">Configurações</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 pr-4 pl-3 py-2.5 text-sm font-bold text-slate-400 hover:text-red-400 bg-slate-900 border border-slate-800 hover:border-red-500/30 rounded-xl transition-all group"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              <span className="hidden sm:block">Sair</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
