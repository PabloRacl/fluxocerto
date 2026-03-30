export type MascotEventType = 'TRANSACTION_EXPENSIVE' | 'GOAL_ACHIEVED' | 'BILL_PAID' | 'RANDOM_POKE' | 'CUSTOM';

export interface MascotEventPayload {
  message: string;
  type: MascotEventType;
  mood?: 'HAPPY' | 'WORRIED' | 'THINKING';
}

type MascotSubscriber = (payload: MascotEventPayload) => void;

class MascotEventEmitter {
  private subscribers: Set<MascotSubscriber> = new Set();

  subscribe(callback: MascotSubscriber) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  emit(payload: MascotEventPayload) {
    this.subscribers.forEach(cb => cb(payload));
  }
}

export const mascotEvents = new MascotEventEmitter();
