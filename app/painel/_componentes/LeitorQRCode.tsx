import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, RefreshCw, Zap, Maximize2, AlertTriangle } from "lucide-react";

interface ScannerQRCodeProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function LeitorQRCode({
  onScanSuccess,
  onScanError,
  isOpen,
  onClose,
}: ScannerQRCodeProps) {
  const [scannerId] = useState(`qr-reader-${Math.random().toString(36).substr(2, 9)}`);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let currentScanner: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        setCameraError(null);
        setIsScanning(false);

        // Aguarda o elemento DOM estar disponível
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
        
        currentScanner = html5QrCode;
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        // Força o uso da câmera traseira (environment)
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            onScanSuccess(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Ignoramos erros de frame individual para não poluir o console
          }
        );

        setIsScanning(true);
      } catch (err: any) {
        console.error("Falha ao iniciar scanner:", err);
        setCameraError(err.message || "Erro ao acessar a câmera. Certifique-se de dar permissão.");
        setIsScanning(false);
      }
    };

    const stopScanner = async () => {
      if (currentScanner && currentScanner.isScanning) {
        try {
          await currentScanner.stop();
          currentScanner.clear();
        } catch (e) {
          console.warn("Erro ao parar scanner:", e);
        }
      }
      setIsScanning(false);
    };

    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, scannerId, onScanSuccess, onScanError]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div key="scanner-overlay" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative w-full max-w-lg bg-slate-900/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-3xl"
          >
            {/* Efeitos de Glow Neuro-Futurista */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px]" />

            <div className="relative p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Maximize2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                      Scanner Neural
                    </h3>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Modo Hardware Ativo</p>
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
              <div className="relative aspect-square w-full max-w-[280px] sm:max-w-[320px] mx-auto overflow-hidden rounded-[2.5rem] border border-white/10 bg-black group shadow-inner">
                
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-40 bg-slate-900/90">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-white font-bold mb-2">Erro de Hardware</p>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                      Não foi possível acessar a câmera traseira. Verifique as permissões do seu navegador Brave/Chrome.
                    </p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-6 py-2 bg-slate-800 rounded-xl text-sm font-bold text-emerald-400 border border-emerald-500/20"
                    >
                      RECARREGAR PÁGINA
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Linhas de Escaneamento Animadas */}
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-20 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                    />
                    
                    {/* Cantos Estilizados */}
                    <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg z-30" />
                    <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg z-30" />
                    <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg z-30" />
                    <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-500 rounded-br-lg z-30" />

                    <div id={scannerId} className="w-full h-full" />
                    
                    {!isScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 transition-opacity">
                        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                        <p className="text-slate-400 text-xs font-black uppercase tracking-tighter">Sincronizando Lentes...</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-black">Lente</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-200">Traseira</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-black">Status</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-200">Neural</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-3xl border border-white/10 bg-slate-800/50 hover:bg-slate-800 text-white font-black text-sm transition-all shadow-xl active:scale-95"
                >
                  FECHAR INTERFACE
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
          border-radius: 2.5rem !important;
        }
        #${scannerId} img {
          display: none !important;
        }
        #qr-canvas-visible {
           border-radius: 2.5rem !important;
        }
      `}</style>
    </AnimatePresence>
  );
}
