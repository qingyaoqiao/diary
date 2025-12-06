import { create } from 'zustand';
import { Message } from '../types';

interface AppState {
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  addMessage: (role: 'user' | 'model', text: string) => void;
  setRecording: (status: boolean) => void;
  setProcessing: (status: boolean) => void;
  setTranscript: (text: string) => void;
  clearTranscript: () => void;
}

export const useStore = create<AppState>((set) => ({
  messages: [
    {
      id: 'init',
      role: 'model',
      text: 'Hello. I am here to listen. Speak your mind, and I will keep your diary.',
      timestamp: Date.now(),
    },
  ],
  isRecording: false,
  isProcessing: false,
  transcript: '',
  addMessage: (role, text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: Math.random().toString(36).substr(2, 9), role, text, timestamp: Date.now() },
      ],
    })),
  setRecording: (status) => set({ isRecording: status }),
  setProcessing: (status) => set({ isProcessing: status }),
  setTranscript: (text) => set({ transcript: text }),
  clearTranscript: () => set({ transcript: '' }),
}));