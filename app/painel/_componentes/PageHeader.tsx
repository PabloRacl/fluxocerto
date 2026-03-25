"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
  onRefresh?: () => void;
  onNew?: () => void;
  newButtonText?: string;
  showFilters?: boolean;
  filters?: React.ReactNode;
  showDashboardLink?: boolean;
  extraActions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  onRefresh,
  onNew,
  newButtonText = "Novo",
  showFilters = false,
  filters,
  showDashboardLink = true,
  extraActions,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/painel");
    }
  };

  const handleDashboard = () => {
    router.push("/painel");
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Lado Esquerdo: Voltar + Título */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>

            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              <p className="text-sm text-slate-400">{subtitle}</p>
            </div>
          </div>

          {/* Lado Direito: Ações */}
          <div className="flex items-center gap-3">
            {/* Filtros (se houver) */}
            {showFilters && filters && (
              <div className="hidden md:flex items-center gap-2">{filters}</div>
            )}

            {/* Botão Refresh (se houver) */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Atualizar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}

            {/* Link Dashboard */}
            {showDashboardLink && (
              <button
                onClick={handleDashboard}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </button>
            )}

            {/* Ações Extras Personalizadas */}
            {extraActions}

            {/* Botão Novo */}
            {onNew && (
              <button
                onClick={onNew}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{newButtonText}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
