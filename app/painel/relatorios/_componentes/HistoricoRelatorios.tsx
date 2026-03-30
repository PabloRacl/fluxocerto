"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Clock, AlertCircle } from "lucide-react";

interface ReportHistory {
  id: string;
  type: "FINANCIAL_MONTHLY" | "CATEGORY_ANALYSIS" | "TRANSACTION_HISTORY";
  parameters: any;
  fileUrl: string | null;
  fileName: string;
  status: "GENERATED" | "PROCESSING" | "FAILED";
  createdAt: string;
}

export function HistoricoRelatorios() {
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/relatorios/historico", { credentials: "include" });
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  const getReportName = (type: string) => {
    switch(type) {
      case "FINANCIAL_MONTHLY": return "Relatório Financeiro Fechado";
      case "CATEGORY_ANALYSIS": return "Análise de Categorias";
      case "TRANSACTION_HISTORY": return "Extrato de Caixa (Transações)";
      default: return type;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8">
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            Arquivos Gerados Recentes
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-400 bg-slate-950/50">
              <tr>
                <th className="px-6 py-4 font-medium rounded-tl-lg">Arquivo</th>
                <th className="px-6 py-4 font-medium">Tipo de Análise</th>
                <th className="px-6 py-4 font-medium">Data de Extração</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right rounded-tr-lg">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse">Carregando históricos...</td></tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 mb-4 opacity-50" />
                      <p>Ainda não há relatórios extraídos salvos da nuvem.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-300 flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded">
                         <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                      {report.fileName}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{getReportName(report.type)}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {report.status === "GENERATED" && <span className="px-2 py-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">Pronto</span>}
                      {report.status === "PROCESSING" && <span className="px-2 py-1 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Na fila...</span>}
                      {report.status === "FAILED" && <span className="px-2 py-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3"/> Erro de Geração</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={report.status !== "GENERATED" || !report.fileUrl}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-slate-700"
                        title={!report.fileUrl ? "Arquivo Removido ou Indisponível" : "Baixar"}
                      >
                        <Download className="w-4 h-4" /> Baixar via AWS
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
