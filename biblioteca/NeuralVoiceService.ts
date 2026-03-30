/**
 * NEURAL VOICE SERVICE (Sapo Mestre)
 * Gerencia a síntese de voz (TTS) com personalidade de "Sapo Anime"
 * e controle de frequência por sessão.
 */

class NeuralVoiceService {
  private static instance: NeuralVoiceService;
  private isMuted: boolean = false;

  private constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("neural_voice_muted") === "true";
    }
  }

  public static getInstance(): NeuralVoiceService {
    if (!NeuralVoiceService.instance) {
      NeuralVoiceService.instance = new NeuralVoiceService();
    }
    return NeuralVoiceService.instance;
  }

  /**
   * Verifica se uma mensagem específica já foi dita nesta sessão (login)
   * @param id Identificador único da mensagem (ex: 'welcome_pablo' ou o texto da dica)
   */
  private wasSaid(id: string): boolean {
    if (typeof window === "undefined") return false;
    const saidItems = JSON.parse(sessionStorage.getItem("neural_said_items") || "[]");
    return saidItems.includes(id);
  }

  private markAsSaid(id: string) {
    if (typeof window === "undefined") return;
    const saidItems = JSON.parse(sessionStorage.getItem("neural_said_items") || "[]");
    if (!saidItems.includes(id)) {
      saidItems.push(id);
      sessionStorage.setItem("neural_said_items", JSON.stringify(saidItems));
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem("neural_voice_muted", String(muted));
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Fala um texto ou toca um arquivo de áudio externo
   */
  public speak(text: string, id?: string, onStart?: () => void, onEnd?: () => void) {
    if (typeof window === "undefined" || this.isMuted) return;

    const msgId = id || text;
    if (this.wasSaid(msgId)) return;

    // 1. TENTAR REPRODUZIR ARQUIVO DE ÁUDIO EXTERNO (.mp3)
    if (id) {
      const audioPath = `/audio/mascote/${id}.mp3`;
      const audio = new Audio(audioPath);
      
      audio.onplay = () => {
        console.log(`[NeuralVoice] Tocando áudio externo: ${id}.mp3`);
        onStart?.();
        this.markAsSaid(msgId);
      };

      audio.onended = () => {
        console.log(`[NeuralVoice] Fim do áudio: ${id}.mp3`);
        onEnd?.();
      };

      audio.onerror = (e) => {
        console.warn(`[NeuralVoice] Áudio não encontrado ou erro no arquivo: ${id}.mp3. Usando fallback TTS.`);
        // Se o arquivo não existir ou falhar, fallback para o TTS do navegador
        this.playTTS(text, msgId, onStart, onEnd);
      };

      audio.play().catch((err) => {
        console.warn(`[NeuralVoice] Bloqueio de autoplay ou erro:`, err);
        // Catch para navegadores que bloqueiam autoplay sem interação
        this.playTTS(text, msgId, onStart, onEnd);
      });
      
      return;
    }

    // 2. FALLBACK: TTS DO NAVEGADOR
    console.log(`[NeuralVoice] Gerando voz sintetizada (TTS) para: ${msgId}`);
    this.playTTS(text, msgId, onStart, onEnd);
  }

  private playTTS(text: string, msgId: string, onStart?: () => void, onEnd?: () => void) {
    if (typeof window === "undefined") return;
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurações "Sapo Anime"
    utterance.pitch = 1.42; 
    utterance.rate = 1.05;  
    utterance.volume = 0.9;
    utterance.lang = "pt-BR";

    utterance.onstart = () => {
      onStart?.();
      this.markAsSaid(msgId);
    };
    utterance.onend = () => {
      onEnd?.();
    };
    utterance.onerror = () => {
      onEnd?.();
    };

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = 
      voices.find(v => v.lang.startsWith('pt') && v.name.includes('Google') && v.name.includes('Female')) || 
      voices.find(v => v.lang.startsWith('pt') && v.name.includes('Google')) || 
      voices.find(v => v.lang.startsWith('pt') && v.name.includes('Maria')) ||
      voices.find(v => v.lang.startsWith('pt') && v.name.includes('Heloisa')) ||
      voices.find(v => v.lang.startsWith('pt'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

export const neuralVoice = NeuralVoiceService.getInstance();
