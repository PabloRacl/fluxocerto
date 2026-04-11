"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Flame,
  Star,
  Target,
  Award,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";
import { api } from "@/biblioteca/http-client";

interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  conquistado: boolean;
  progresso: number;
}

interface NivelInfo {
  nivel: number;
  nome: string;
  icone: string;
  xp: number;
  xpNecessario: number;
  xpAtual: number;
  progressoNivel: number;
}

interface GamificacaoData {
  nivel: NivelInfo;
  streak: number;
  badges: Badge[];
  resumo: {
    totalBadges: number;
    badgesConquistados: number;
    totalTransacoes: number;
    metasConcluidas: number;
    dividasQuitadas: number;
  };
}

export function PainelGamificacao({ userId }: { userId: string }) {
  const [data, setData] = useState<GamificacaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const d = await api.get<GamificacaoData>("/api/painel/gamificacao");
      setData(d);
    } catch (err) {
      console.error("Erro ao carregar gamificação:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-24" />
      </div>
    );
  }

  const badgesConquistados = data.badges.filter((b) => b.conquistado);
  const badgesPendentes = data.badges.filter((b) => !b.conquistado);
  return (
    <div className="space-y-8">
      {/* HUD Superior: Level e Informações Core */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Nível do Usuário */}
        <div className="md:col-span-2 relative bg-slate-950/60 backdrop-blur-2xl rounded-2xl p-6 md:p-8 border border-amber-500/30 overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.1)] group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex flex-col items-center justify-center border border-amber-500/40 shadow-inner">
              <span className="text-5xl sm:text-6xl drop-shadow-lg">{data.nivel.icone}</span>
            </div>
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
                <div>
                  <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">Nível {data.nivel.nivel}</h3>
                  <h2 className="text-3xl sm:text-4xl font-black text-white">{data.nivel.nome}</h2>
                </div>
                {data.streak > 0 && (
                  <div className="mt-4 sm:mt-0 flex flex-col items-center sm:items-end">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                      <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                      <span className="text-lg font-black text-orange-400">{data.streak} Dias</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Sequência Invicta</span>
                  </div>
                )}
              </div>
              
              <div className="mt-6 w-full">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  <span>{data.nivel.xpAtual} XP Obtido</span>
                  <span className="text-amber-400">{data.nivel.xpNecessario} XP para o Nível {data.nivel.nivel + 1}</span>
                </div>
                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 relative"
                    style={{ width: `${data.nivel.progressoNivel}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30 animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo do Perfil */}
        <div className="relative bg-slate-950/60 backdrop-blur-2xl rounded-2xl p-6 border border-slate-800 flex flex-col justify-center gap-4">
          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{data.resumo.badgesConquistados}<span className="text-sm font-medium text-slate-500 ml-1">/ {data.resumo.totalBadges}</span></p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Insígnias Desbloqueadas</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{data.resumo.metasConcluidas}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Metas Batidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Arsenal de Insígnias */}
      <div className="bg-slate-950/40 rounded-2xl border border-slate-800/50 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <Award className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-bold text-white tracking-tight">Arsenal de Insígnias</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.badges.map((badge) => {
            const isUnlocked = badge.conquistado;
            return (
              <div
                key={badge.id}
                className={`group relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 flex flex-col h-full ${
                  isUnlocked
                    ? "bg-gradient-to-b from-emerald-900/20 to-slate-900/50 border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_4px_20px_rgba(16,185,129,0.05)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1"
                    : "bg-slate-900/30 border-slate-800 shadow-none grayscale hover:grayscale-0"
                }`}
              >
                {/* Efeito Glow Interno (Apenas quando desbloqueado) */}
                {isUnlocked && (
                   <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 blur-[50px] group-hover:bg-emerald-500/30 transition-all pointer-events-none" />
                )}

                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className={`text-4xl filter drop-shadow-md transition-transform duration-300 group-hover:scale-110 ${!isUnlocked && 'opacity-50'}`}>
                    {badge.icone}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold leading-tight ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                      {badge.nome}
                    </h4>
                    {isUnlocked && (
                      <span className="inline-flex mt-1 items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                         <Star className="w-2.5 h-2.5 fill-emerald-400" /> Desbloqueado
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-6 flex-1 relative z-10">
                  {badge.descricao}
                </p>

                {/* Barra de Progresso Visível Sempre na Base da Insígnia */}
                <div className="mt-auto relative z-10">
                   <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      <span>Progresso</span>
                      <span className={isUnlocked ? 'text-emerald-400' : 'text-slate-400'}>{badge.progresso}%</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                         className={`h-full rounded-full transition-all duration-1000 ${isUnlocked ? 'bg-emerald-500' : 'bg-slate-600'}`} 
                         style={{ width: `${badge.progresso}%` }} 
                      />
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
