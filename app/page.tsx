"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-50 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.35), transparent 70%)",
            transform: `translate(calc(-50% + ${mousePosition.x}px), calc(-50% + ${mousePosition.y}px))`,
            transition: "transform 0.5s ease-out",
          }}
        />
        <div
          className="absolute top-0 left-1/4 w-[400px] h-[400px] opacity-20 rounded-full blur-3xl animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(20, 184, 166, 0.4), transparent 70%)",
          }}
        />
      </div>

      {/* Dollar signs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-16 left-[5%]"
          style={{ animation: "fadeInOut 4s ease-in-out infinite" }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-50 animate-pulse" />
            <span className="relative text-5xl font-bold text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.7)]">
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
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-40 animate-pulse" />
            <span className="relative text-4xl font-bold text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.7)]">
              $
            </span>
          </div>
        </div>
        <div
          className="absolute bottom-32 right-[5%]"
          style={{
            animation: "fadeInOut 5.5s ease-in-out infinite",
            animationDelay: "0.5s",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-40 animate-pulse" />
            <span className="relative text-5xl font-bold text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.7)]">
              $
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            FluxoCerto
          </span>
        </div>
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
          {/* Logo */}
          <div className="inline-flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur-2xl opacity-30 animate-pulse" />
            <div
              className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl flex items-center justify-center animate-bounce"
              style={{ animationDuration: "2.5s" }}
            >
              <svg
                className="w-11 h-11 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
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
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-3xl mx-auto">
            <div className="group p-4 bg-gradient-to-br from-emerald-950/40 to-slate-900/40 backdrop-blur-md rounded-2xl border border-emerald-500/20 hover:border-emerald-500/50 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3.667M9 17V14m-6 3h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-white mb-1">
                Controle Total
              </h3>
              <p className="text-xs text-slate-400">
                Receitas, despesas e cartões
              </p>
            </div>
            <div className="group p-4 bg-gradient-to-br from-teal-950/40 to-slate-900/40 backdrop-blur-md rounded-2xl border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Compras</h3>
              <p className="text-xs text-slate-400">
                Itens e histórico de preços
              </p>
            </div>
            <div className="group p-4 bg-gradient-to-br from-green-950/40 to-slate-900/40 backdrop-blur-md rounded-2xl border border-green-500/20 hover:border-green-500/50 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Dashboard</h3>
              <p className="text-xs text-slate-400">Gráficos e alertas</p>
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
