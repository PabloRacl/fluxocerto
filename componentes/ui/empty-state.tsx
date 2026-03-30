import { LucideIcon } from "lucide-react";
import React from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-800/80 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
      <div className="w-20 h-20 bg-slate-800/60 rounded-full flex items-center justify-center mb-5 text-slate-500 shadow-inner">
        <Icon className="w-10 h-10 shadow-sm" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
