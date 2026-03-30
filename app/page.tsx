"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Wallet, TrendingDown, ShoppingCart, CalendarClock, Leaf } from "lucide-react";
import { BrandLogo } from "@/app/_componentes/BrandLogo";
import { motion, AnimatePresence } from "framer-motion";

// Componente para Folhas Flutuantes (Orgânico)
const LeavesBackground = () => {
  // Aumentamos para 20 folhas para melhor preenchimento
  const leaves = Array.from({ length: 20 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {leaves.map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: `${Math.random() * 100}%`, // Espalha por toda a largura
            y: -100, 
            rotate: Math.random() * 360,
            opacity: 0 
          }}
          animate={{ 
            y: "110vh", 
            rotate: 720,
            x: `${(Math.random() * 100)}%`, // Drift horizontal lento
            opacity: [0, 0.5, 0.5, 0] 
          }}
          transition={{ 
            duration: Math.random() * 30 + 30, // Queda bem lenta (30-60 seg)
            repeat: Infinity, 
            delay: Math.random() * 30,
            ease: "linear"
          }}
          className="absolute text-emerald-500/20"
        >
          {/* Tamanhos variados para profundidade */}
          <Leaf size={Math.random() * 30 + 10} />
        </motion.div>
      ))}
    </div>
  );
};

// Componente para Pingo d'água e Ondulação (Ripple)
const WaterRippleEffect = () => {
  return (
    <div className="absolute bottom-1/4 left-1/4 pointer-events-none">
      {/* Pingo caindo */}
      <motion.div
        initial={{ y: -400, opacity: 0, scale: 0.5 }}
        animate={{ 
          y: 0, 
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.8]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          times: [0, 0.2, 0.3],
          repeatDelay: 2 
        }}
        className="w-2 h-4 bg-emerald-400/60 rounded-full blur-[1px]"
      />
      
      {/* Ondas na poça */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 4], 
            opacity: [0, 0.5, 0] 
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            delay: 0.8 + (i * 0.4),
            repeatDelay: 2
          }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-10 border-2 border-emerald-400/30 rounded-[100%] blur-sm"
        />
      ))}
    </div>
  );
};

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePosition({ x: x * 30, y: y * 30 });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen bg-slate-950 overflow-hidden relative flex flex-col"
    >
      {/* Background Camadas */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Orb Neural */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-40 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent 70%)",
            transform: `translate(calc(-50% + ${mousePosition.x}px), calc(-50% + ${mousePosition.y}px))`,
            transition: "transform 0.5s ease-out",
          }}
        />
        
        {/* Elementos Orgânicos */}
        <LeavesBackground />
        <WaterRippleEffect />
      </div>

      {/* Sifrões Pulsantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-16 left-[5%]"
          style={{ animation: "fadeInOut 4s ease-in-out infinite" }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-30 animate-pulse" />
            <span className="relative text-5xl font-bold text-amber-400/80 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              $
            </span>
          </div>
        </div>
        <div
          className="absolute top-24 right-[8%]"
          style={{
            animation: "fadeInOut 5s ease-in-out infinite",
            animationDelay: "1.5s",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-30 animate-pulse" />
            <span className="relative text-4xl font-bold text-yellow-400/80 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]">
              $
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center bg-slate-950/20 backdrop-blur-sm">
        <BrandLogo size="md" />
        <div className="flex gap-3">
          <Link
            href="/entrar"
            className="px-5 py-2 text-emerald-300 font-medium hover:text-emerald-100 transition-colors text-sm"
          >
            Login
          </Link>
          <Link
            href="/cadastro"
            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-2xl hover:shadow-emerald-500/50 transition-all hover:scale-105 text-sm"
          >
            Começar
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 -mt-8">
        <div className="max-w-4xl w-full text-center space-y-6">
          {/* Logo Central Pulsante */}
          <div className="inline-flex items-center justify-center relative">
             <BrandLogo size="xl" showText={false} />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Controle suas{" "}
            </span>
            <span className="text-white drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              finanças
            </span>
            <br />
            <span className="text-emerald-300 text-2xl md:text-3xl lg:text-4xl">
              com inteligência
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto">
            Gerencie receitas, despesas, compras e dívidas em um só lugar.
            <span className="text-emerald-400 font-semibold ml-1">
              Simples, inteligente e gratuito.
            </span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <Link
              href="/cadastro"
              className="group relative px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all transform hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2 text-lg">
                Começar Gratuitamente
                <svg
                  className="w-5 h-5 group-hover:translate-x-2 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Link>
            <Link
              href="/entrar"
              className="px-8 py-3.5 bg-white/10 backdrop-blur-md text-emerald-300 font-bold rounded-2xl border-2 border-emerald-400/50 hover:border-emerald-400 hover:bg-white/20 transition-all hover:scale-105"
            >
              <span className="flex items-center gap-2 text-lg">
                Já tenho conta
              </span>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 max-w-4xl mx-auto w-full">
            <div className="group p-4 bg-gradient-to-br from-emerald-950/40 to-slate-900/40 backdrop-blur-md rounded-2xl border border-emerald-500/20 hover:border-emerald-500/50 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mb-3 mx-auto">
                 <Wallet className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">
                Controle Total
              </h3>
              <p className="text-xs text-slate-400">
                Receitas e despesas
              </p>
            </div>
            
            <div className="group p-4 bg-gradient-to-br from-red-950/40 to-slate-900/40 backdrop-blur-md rounded-2xl border border-red-500/20 hover:border-red-500/50 transition-all hover:-translate-y-1">
               <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-rose-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
                 <TrendingDown className="w-5 h-5 text-white" />
               </div>
               <h3 className="font-bold text-sm text-white mb-1">Dívidas</h3>
               <p className="text-xs text-slate-400">Planos e amortizações</p>
            </div>

            <div className="group p-4 bg-gradient-to-br from-teal-950/40 to-slate-900/40 backdrop-blur-md rounded-2xl border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Compras</h3>
              <p className="text-xs text-slate-400">
                Histórico e carrinho
              </p>
            </div>

            <div className="group p-4 bg-gradient-to-br from-blue-950/40 to-slate-900/40 backdrop-blur-md rounded-2xl border border-blue-500/20 hover:border-blue-500/50 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <CalendarClock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Assinaturas</h3>
              <p className="text-xs text-slate-400">Gerencie recorrentes</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-3 text-center text-slate-500 text-xs">
        <p>© 2026 FluxoCerto — Controle financeiro inteligente</p>
      </footer>
    </div>
  );
}
