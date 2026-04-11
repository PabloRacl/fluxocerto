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
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header com Nível e Streak */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Gamificação</h3>
          </div>
          {data.streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400">
                {data.streak} dias
              </span>
            </div>
          )}
        </div>

        {/* Nível */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
            <span className="text-3xl">{data.nivel.icone}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white">
                Nível {data.nivel.nivel}
              </span>
              <span className="text-xs text-amber-400">
                ({data.nivel.nome})
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                style={{ width: `${data.nivel.progressoNivel}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {data.nivel.xpAtual} / 200 XP para o próximo nível
            </p>
          </div>
        </div>

        {/* Badges conquistados (preview) */}
        <div className="flex items-center gap-2 flex-wrap">
          {badgesConquistados.slice(0, expanded ? 999 : 5).map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700"
              title={`${badge.nome}: ${badge.descricao}`}
            >
              <span className="text-lg">{badge.icone}</span>
              <span className="text-xs text-slate-300 hidden sm:inline">
                {badge.nome}
              </span>
            </div>
          ))}
          {badgesConquistados.length === 0 && (
            <p className="text-xs text-slate-500">
              Nenhum badge conquistado ainda. Continue usando o app!
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>
            {data.resumo.badgesConquistados}/{data.resumo.totalBadges} badges
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? "Ver menos" : "Ver todos"}
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Badges detalhados (expandido) */}
      {expanded && (
        <div className="border-t border-slate-800 p-6">
          <h4 className="text-sm font-semibold text-white mb-4">
            Todos os Badges
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border transition-all ${
                  badge.conquistado
                    ? "bg-amber-500/5 border-amber-500/30"
                    : "bg-slate-800/30 border-slate-700/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{badge.icone}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-semibold text-white">
                        {badge.nome}
                      </h5>
                      {badge.conquistado && (
                        <Star className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{badge.descricao}</p>
                    {!badge.conquistado && (
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-600 transition-all"
                            style={{ width: `${badge.progresso}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {badge.progresso}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
