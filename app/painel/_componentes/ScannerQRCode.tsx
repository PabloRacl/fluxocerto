"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, RefreshCw, Zap, Maximize2 } from "lucide-react";

interface ScannerQRCodeProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ScannerQRCode({
  onScanSuccess,
  onScanError,
  isOpen,
  onClose,
}: ScannerQRCodeProps) {
  const [scannerId] = useState(`qr-reader-${Math.random().toString(36).substr(2, 9)}`);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          showTorchButtonIfSupported: true,
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          setIsScanning(false);
          onScanSuccess(decodedText);
          scanner.clear();
          scannerRef.current = null;
        },
        (error) => {
          if (onScanError) onScanError(error);
        }
      );

      scannerRef.current = scanner;
      setIsScanning(true);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, scannerId, onScanSuccess, onScanError]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-slate-900/40 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-2xl"
          >
            {/* Efeitos de Glow Neuro-Futurista */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px]" />

            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Maximize2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                      Scanner Neural
                    </h3>
                    <p className="text-sm text-slate-400">Aponte para o QR Code da NF</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Área do Scanner com Moldura Futurista */}
              <div className="relative aspect-square w-full max-w-[320px] mx-auto overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/50 group">
                {/* Linhas de Escaneamento Animadas */}
                <motion.div
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-10 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                />
                
                {/* Cantos Estilizados */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg z-20" />
                <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg z-20" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg z-20" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-500 rounded-br-lg z-20" />

                <div id={scannerId} className="w-full h-full overflow-hidden" />
                
                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-30">
                    <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                    <p className="text-slate-300 font-medium">Iniciando Biometria Visual...</p>
                  </div>
                )}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Velocidade</span>
                    <span className="text-sm font-bold text-slate-200">Instantânea</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Resolução</span>
                    <span className="text-sm font-bold text-slate-200">Adaptativa</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all border border-white/5"
                >
                  FECHAR SCANNER
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <style jsx global>{`
        #${scannerId} video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 2rem !important;
        }
        #${scannerId}__dashboard {
          display: none !important;
        }
        #${scannerId}__status_span {
          display: none !important;
        }
        #${scannerId} img {
          display: none !important;
        }
        #qr-canvas-visible {
           border-radius: 2rem !important;
        }
      `}</style>
    </AnimatePresence>
  );
}
