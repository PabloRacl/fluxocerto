import Link from "next/link";
import { ChevronRight, Home, ArrowLeft, RefreshCw, Plus } from "lucide-react";
import React from "react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  
  // Props Legadas (Retro-Compatibilidade)
  subtitle?: string;
  onBack?: () => void;
  onRefresh?: () => void;
  onNew?: () => void;
  newButtonText?: string;
  showDashboardLink?: boolean;
  extraActions?: React.ReactNode;
  showFilters?: boolean;
  filters?: React.ReactNode;

  children?: React.ReactNode;
}

export function CabecalhoPagina({ 
  title, 
  description, 
  breadcrumbs, 
  subtitle,
  onBack,
  onRefresh,
  onNew,
  newButtonText = "Novo",
  showDashboardLink,
  extraActions,
  showFilters,
  filters,
  children 
}: PageHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 md:py-5 min-h-[5rem]">
          
          <div className="flex flex-col">
            {/* Breadcrumb Navigation - Moderno */}
            {breadcrumbs ? (
              <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Link href="/painel" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  Painel
                </Link>
                {breadcrumbs.map((bc, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    {bc.href ? (
                      <Link href={bc.href} className="hover:text-emerald-400 transition-colors">
                        {bc.label}
                      </Link>
                    ) : (
                      <span className="text-slate-200">{bc.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            ) : (
              /* Breadcrumb Legado (Retrocompatibilidade) */
              onBack && (
                <button
                  onClick={onBack}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 mb-2 w-max"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Voltar</span>
                </button>
              )
            )}

            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {title}
            </h1>
            {(description || subtitle) && (
              <p className="text-sm text-slate-400 mt-0.5">{description || subtitle}</p>
            )}
          </div>

          {/* Slots de Ação Flexíveis */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide">
            
            {/* Ações Legadas */}
            {extraActions}
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Atualizar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}

            {onNew && (
               <button
                 onClick={onNew}
                 className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
               >
                 <Plus className="w-4 h-4" />
                 <span className="hidden sm:block">{newButtonText}</span>
               </button>
            )}

            {/* Nova Arquitetura de Children */}
            {children}
          </div>
        </div>

        {/* Filtros Legados */}
        {showFilters && filters && (
          <div className="py-3 border-t border-slate-800/50 mt-2">
            {filters}
          </div>
        )}
      </div>
    </header>
  );
}
