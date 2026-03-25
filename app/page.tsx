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
      className="min-h-screen bg-slate-950 overflow-hidden relative"
    >
      {/* ============================================
          BACKGROUND COM GRADIENTE CENTRAL (ESTILO OPTIRO)
          ============================================ */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradiente central verde intenso (efeito spotlight) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-60 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.4), transparent 70%)",
            transform: `translate(calc(-50% + ${mousePosition.x}px), calc(-50% + ${mousePosition.y}px))`,
            transition: "transform 0.5s ease-out",
          }}
        />

        {/* Gradiente secundário superior */}
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] opacity-30 rounded-full blur-3xl animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(20, 184, 166, 0.5), transparent 70%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />

        {/* Gradiente inferior direito */}
        <div
          className="absolute bottom-0 right-0 w-[700px] h-[700px] opacity-25 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(5, 150, 105, 0.4), transparent 70%)",
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            transition: "transform 0.6s ease-out",
          }}
        />

        {/* Gradiente superior esquerdo */}
        <div
          className="absolute top-0 left-0 w-[500px] h-[500px] opacity-20 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(52, 211, 153, 0.3), transparent 70%)",
            transform: `translate(${-mousePosition.x * 0.4}px, ${-mousePosition.y * 0.4}px)`,
            transition: "transform 0.7s ease-out",
          }}
        />
      </div>

      {/* ============================================
          CIFRÕES DOURADOS ANIMADOS
          ============================================ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cifrão 1 - Superior esquerdo */}
        <div
          className="absolute top-20 left-[5%] opacity-0"
          style={{
            animation: "fadeInOut 4s ease-in-out infinite",
            animationDelay: "0s",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-60 animate-pulse" />
            <span className="relative text-6xl font-bold text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
              $
            </span>
          </div>
        </div>

        {/* Cifrão 2 - Superior direito */}
        <div
          className="absolute top-32 right-[8%] opacity-0"
          style={{
            animation: "fadeInOut 5s ease-in-out infinite",
            animationDelay: "1.5s",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-50 animate-pulse" />
            <span className="relative text-5xl font-bold text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]">
              $
            </span>
          </div>
        </div>

        {/* Cifrão 3 - Centro esquerdo */}
        <div
          className="absolute top-1/3 left-[3%] opacity-0"
          style={{
            animation: "fadeInOut 6s ease-in-out infinite",
            animationDelay: "3s",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-40 animate-pulse" />
            <span className="relative text-4xl font-bold text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
              $
            </span>
          </div>
        </div>

        {/* Cifrão 4 - Inferior esquerdo */}
        <div
          className="absolute bottom-32 left-[10%] opacity-0"
          style={{
            animation: "fadeInOut 4.5s ease-in-out infinite",
            animationDelay: "2s",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500 rounded-full blur-lg opacity-55 animate-pulse" />
            <span className="relative text-5xl font-bold text-yellow-500 drop-shadow-[0_0_14px_rgba(234,179,8,0.8)]">
              $
            </span>
          </div>
        </div>

        {/* Cifrão 5 - Inferior direito */}
        <div
          className="absolute bottom-40 right-[5%] opacity-0"
          style={{
            animation: "fadeInOut 5.5s ease-in-out infinite",
            animationDelay: "0.5s",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-50 animate-pulse" />
            <span className="relative text-6xl font-bold text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.8)]">
              $
            </span>
          </div>
        </div>

        {/* Cifrão 6 - Centro direito (pequeno) */}
        <div
          className="absolute top-1/2 right-[12%] opacity-0"
          style={{
            animation: "fadeInOut 3.5s ease-in-out infinite",
            animationDelay: "2.5s",
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-300 rounded-full blur-md opacity-45 animate-pulse" />
            <span className="relative text-3xl font-bold text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]">
              $
            </span>
          </div>
        </div>

        {/* Moedas flutuantes extras */}
        <div
          className="absolute top-24 left-[20%] opacity-0"
          style={{
            animation:
              "fadeInOut 7s ease-in-out infinite, floatCoin 6s ease-in-out infinite",
            animationDelay: "1s",
          }}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.6)]">
            <span className="text-2xl font-bold text-amber-900">$</span>
          </div>
        </div>

        <div
          className="absolute bottom-24 right-[18%] opacity-0"
          style={{
            animation:
              "fadeInOut 6.5s ease-in-out infinite, floatCoin 5s ease-in-out infinite",
            animationDelay: "3.5s",
          }}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_18px_rgba(250,204,21,0.6)]">
            <span className="text-xl font-bold text-yellow-900">$</span>
          </div>
        </div>
      </div>

      {/* ============================================
          PARTÍCULAS FLUTUANTES ANIMADAS
          ============================================ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Partícula 1 */}
        <div
          className="absolute top-20 left-[10%] w-4 h-4 bg-emerald-400 rounded-full opacity-60 blur-sm"
          style={{
            animation: "floatParticle 15s ease-in-out infinite",
          }}
        />

        {/* Partícula 2 */}
        <div
          className="absolute top-40 right-[15%] w-6 h-6 bg-teal-400 rounded-full opacity-40 blur-md"
          style={{
            animation: "floatParticle 18s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />

        {/* Partícula 3 */}
        <div
          className="absolute bottom-40 left-[20%] w-3 h-3 bg-green-400 rounded-full opacity-50 blur-sm"
          style={{
            animation: "floatParticle 12s ease-in-out infinite",
            animationDelay: "4s",
          }}
        />

        {/* Partícula 4 */}
        <div
          className="absolute bottom-20 right-[25%] w-5 h-5 bg-emerald-300 rounded-full opacity-30 blur-md"
          style={{
            animation: "floatParticle 20s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />

        {/* Linhas decorativas animadas */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent animate-pulse" />
        <div
          className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* ============================================
          ELEMENTOS DECORATIVOS (FOLHAS E ÍCONES)
          ============================================ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Folha 1 - Superior esquerda */}
        <div
          className="absolute top-32 left-[8%] opacity-40"
          style={{
            animation: "rotateFloat 10s ease-in-out infinite",
          }}
        >
          <svg
            className="w-20 h-20 text-emerald-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>

        {/* Folha 2 - Inferior direita */}
        <div
          className="absolute bottom-40 right-[10%] opacity-30"
          style={{
            animation: "rotateFloat 12s ease-in-out infinite reverse",
          }}
        >
          <svg
            className="w-24 h-24 text-teal-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>

        {/* Ícone de gráfico animado */}
        <div
          className="absolute top-1/3 right-[12%] opacity-20"
          style={{
            animation: "bounce 3s ease-in-out infinite",
          }}
        >
          <svg
            className="w-28 h-28 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>

        {/* Círculos decorativos */}
        <div
          className="absolute top-1/4 left-[15%] w-32 h-32 border border-emerald-500/20 rounded-full animate-ping"
          style={{ animationDuration: "3s" }}
        />
        <div
          className="absolute bottom-1/3 right-[18%] w-24 h-24 border border-teal-500/20 rounded-full animate-ping"
          style={{ animationDuration: "4s", animationDelay: "1s" }}
        />
      </div>

      {/* ============================================
          CONTEÚDO PRINCIPAL
          ============================================ */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full p-6 flex justify-between items-center backdrop-blur-sm bg-slate-950/30">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <svg
                  className="w-7 h-7 text-white"
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
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-teal-300 transition-all">
              FluxoCerto
            </span>
          </div>

          <div className="flex gap-4">
            <Link
              href="/entrar"
              className="px-6 py-2.5 text-emerald-300 font-medium hover:text-emerald-100 transition-colors hover:scale-105 transform"
            >
              Login
            </Link>
            <Link
              href="/cadastro"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-2xl hover:shadow-emerald-500/50 transition-all transform hover:scale-105 border border-emerald-400/30"
            >
              Começar
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-8">
          <div
            className="max-w-6xl w-full text-center space-y-12"
            style={{
              transform: `perspective(1000px) rotateX(${-mousePosition.y * 0.1}deg) rotateY(${mousePosition.x * 0.1}deg)`,
              transition: "transform 0.3s ease-out",
            }}
          >
            {/* Hero Section - TEXTO AJUSTADO */}
            <div className="space-y-8">
              {/* Logo Animada */}
              <div className="inline-flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur-2xl opacity-40 animate-pulse" />
                <div
                  className="relative w-28 h-28 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl flex items-center justify-center animate-bounce"
                  style={{ animationDuration: "2s" }}
                >
                  <svg
                    className="w-16 h-16 text-white"
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
                {/* Sparkles ao redor */}
                <div
                  className="absolute -top-2 -right-2 text-4xl animate-ping"
                  style={{ animationDuration: "2s" }}
                >
                  ✨
                </div>
                <div
                  className="absolute -bottom-2 -left-2 text-3xl animate-ping"
                  style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
                >
                  💚
                </div>
              </div>
              <div className="h-16 md:h-20"></div>
              {/* Título Principal - TAMANHO REDUZIDO E ALINHADO */}
              <div className="space-y-4 leading-tight">
                <h1 className="text-5xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent block">
                    Controle suas
                  </span>
                  <span className="text-white drop-shadow-[0_0_30px_rgba(16,185,129,0.5)] block mt-2">
                    finanças
                  </span>
                  <span className="text-emerald-300 text-3xl md:text-4xl lg:text-5xl block mt-2">
                    com inteligência
                  </span>
                </h1>
              </div>

              <p
                className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed animate-pulse px-4"
                style={{ animationDuration: "3s" }}
              >
                Gerencie receitas, despesas, compras e dívidas em um só lugar.
                <span className="text-emerald-400 font-semibold block mt-2">
                  Simples, inteligente e gratuito.
                </span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8 px-4">
              <Link
                href="/cadastro"
                className="group relative px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-3 text-xl">
                  Começar Gratuitamente
                  <svg
                    className="w-6 h-6 group-hover:translate-x-2 transition-transform"
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
                className="group px-10 py-5 bg-white/10 backdrop-blur-md text-emerald-300 font-bold rounded-2xl border-2 border-emerald-400/50 hover:border-emerald-400 hover:bg-white/20 shadow-xl hover:shadow-emerald-500/30 transition-all transform hover:scale-105 hover:-translate-y-1"
              >
                <span className="flex items-center gap-3 text-xl">
                  Já tenho conta
                  <svg
                    className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                </span>
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 pt-16 px-4">
              {/* Card 1 */}
              <div className="group relative p-8 bg-gradient-to-br from-emerald-950/50 to-slate-900/50 backdrop-blur-md rounded-3xl border border-emerald-500/30 shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-3 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 3.666V14m-6.118 4.134l.692-2.768a2 2 0 011.94-1.516h2.972a2 2 0 011.94 1.516l.692 2.768M3.056 13h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-2xl text-white mb-3 group-hover:text-emerald-300 transition-colors">
                    Controle Total
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Gerencie receitas, despesas, contas e cartões em um só
                    lugar.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group relative p-8 bg-gradient-to-br from-teal-950/50 to-slate-900/50 backdrop-blur-md rounded-3xl border border-teal-500/30 shadow-2xl hover:shadow-teal-500/40 transition-all duration-300 hover:-translate-y-3 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <svg
                      className="w-8 h-8 text-white"
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
                  <h3 className="font-bold text-2xl text-white mb-3 group-hover:text-teal-300 transition-colors">
                    Módulo de Compras
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Registre compras com itens detalhados e histórico de preços.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group relative p-8 bg-gradient-to-br from-green-950/50 to-slate-900/50 backdrop-blur-md rounded-3xl border border-green-500/30 shadow-2xl hover:shadow-green-500/40 transition-all duration-300 hover:-translate-y-3 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <svg
                      className="w-8 h-8 text-white"
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
                  <h3 className="font-bold text-2xl text-white mb-3 group-hover:text-green-300 transition-colors">
                    Dashboard Inteligente
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Acompanhe gráficos, indicadores e alertas em tempo real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full p-6 text-center text-slate-400 text-sm">
          <p className="flex items-center justify-center gap-2 animate-pulse">
            <span>© 2026 FluxoCerto</span>
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
            <span>Controle financeiro inteligente</span>
            <span
              className="w-1 h-1 bg-emerald-400 rounded-full animate-ping"
              style={{ animationDelay: "0.5s" }}
            />
            <span className="text-2xl animate-bounce">🌿</span>
          </p>
        </footer>
      </div>

      {/* ============================================
          KEYFRAMES CSS INLINE (para animações personalizadas)
          ============================================ */}
      <style jsx>{`
        @keyframes floatParticle {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-30px) translateX(20px);
          }
          50% {
            transform: translateY(-20px) translateX(-20px);
          }
          75% {
            transform: translateY(-40px) translateX(10px);
          }
        }

        @keyframes rotateFloat {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(30px);
          }
        }

        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes fadeInOut {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
          20%,
          80% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }

        @keyframes floatCoin {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(180deg);
          }
        }

        .animate-gradient {
          animation: gradient 8s ease infinite;
        }
      `}</style>
    </div>
  );
}
