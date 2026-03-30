"use client";

import { useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  theme?: "emerald" | "red" | "blue" | "amber" | "teal" | "purple" | "slate";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export function AnimatedModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  theme = "emerald",
  maxWidth = "2xl",
}: AnimatedModalProps) {
  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Config do tema
  const getThemeStyles = () => {
    switch (theme) {
      case "emerald":
        return {
          bgGradient: "from-emerald-500/10 via-teal-500/10 to-slate-900/10",
          iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30",
          textGradient: "from-emerald-400 to-teal-400",
          borderHover: "hover:border-emerald-500/50",
          borderFocus: "focus:border-emerald-500 focus:ring-emerald-500/20",
        };
      case "red":
        return {
          bgGradient: "from-red-500/10 via-rose-500/10 to-slate-900/10",
          iconBg: "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30",
          textGradient: "from-red-400 to-rose-400",
          borderHover: "hover:border-red-500/50",
          borderFocus: "focus:border-red-500 focus:ring-red-500/20",
        };
      case "blue":
        return {
          bgGradient: "from-blue-500/10 via-cyan-500/10 to-slate-900/10",
          iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/30",
          textGradient: "from-blue-400 to-cyan-400",
          borderHover: "hover:border-blue-500/50",
          borderFocus: "focus:border-blue-500 focus:ring-blue-500/20",
        };
      case "amber":
        return {
          bgGradient: "from-amber-500/10 via-orange-500/10 to-slate-900/10",
          iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30",
          textGradient: "from-amber-400 to-orange-400",
          borderHover: "hover:border-amber-500/50",
          borderFocus: "focus:border-amber-500 focus:ring-amber-500/20",
        };
      case "purple":
        return {
          bgGradient: "from-purple-500/10 via-fuchsia-500/10 to-slate-900/10",
          iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-purple-500/30",
          textGradient: "from-purple-400 to-fuchsia-400",
          borderHover: "hover:border-purple-500/50",
          borderFocus: "focus:border-purple-500 focus:ring-purple-500/20",
        };
      case "teal":
        return {
          bgGradient: "from-teal-500/10 via-cyan-500/10 to-slate-900/10",
          iconBg: "bg-gradient-to-br from-teal-500 to-cyan-600 shadow-teal-500/30",
          textGradient: "from-teal-400 to-cyan-400",
          borderHover: "hover:border-teal-500/50",
          borderFocus: "focus:border-teal-500 focus:ring-teal-500/20",
        };
      case "slate":
      default:
        return {
          bgGradient: "from-slate-500/10 via-slate-600/10 to-slate-900/10",
          iconBg: "bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/30",
          textGradient: "from-slate-300 to-slate-100",
          borderHover: "hover:border-slate-500/50",
          borderFocus: "focus:border-slate-500 focus:ring-slate-500/20",
        };
    }
  };

  const styles = getThemeStyles();
  const maxWidthClass = `max-w-${maxWidth}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`relative w-full ${maxWidthClass}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradiente de Fundo Reativo */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`absolute inset-0 bg-gradient-to-br ${styles.bgGradient} rounded-3xl blur-2xl`} 
              />

              {/* Caixa Principal */}
              <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    {icon && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${styles.iconBg}`}
                      >
                        {icon}
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <h2 className={`text-2xl font-bold bg-gradient-to-r ${styles.textGradient} bg-clip-text text-transparent`}>
                        {title}
                      </h2>
                      {subtitle && (
                        <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
                      )}
                    </motion.div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Conteúdo Customizável */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  {children}
                </motion.div>
                
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
