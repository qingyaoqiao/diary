export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AudioState {
  isListening: boolean;
  volume: number; // 0 to 1
  frequencyData: Uint8Array;
}

// Global declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}