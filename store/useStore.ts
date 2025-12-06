import { create } from 'zustand';
import { Message } from '../types';

export interface ArchivedEntry {
  id: string;
  timestamp: number;
  diaryEntry: string;
  messages: Message[];
}

interface AppState {
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  backgroundImage: string | null;
  diaryEntry: string | null;
  archives: ArchivedEntry[];
  addMessage: (role: 'user' | 'model', text: string) => void;
  setRecording: (status: boolean) => void;
  setProcessing: (status: boolean) => void;
  setTranscript: (text: string) => void;
  clearTranscript: () => void;
  setBackgroundImage: (url: string | null) => void;
  setDiaryEntry: (entry: string | null) => void;
  archiveCurrentSession: () => void;
  deleteArchive: (id: string) => void;
  resetSession: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  messages: [
    {
      id: 'init',
      role: 'model',
      text: '你好。我是你的心灵日记。告诉我你的心事，我会静静倾听。',
      timestamp: Date.now(),
    },
  ],
  isRecording: false,
  isProcessing: false,
  transcript: '',
  backgroundImage: null,
  diaryEntry: null,
  archives: [],
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
  setBackgroundImage: (url) => set({ backgroundImage: url }),
  setDiaryEntry: (entry) => set({ diaryEntry: entry }),
  
  archiveCurrentSession: () => {
    const { diaryEntry, messages } = get();
    if (!diaryEntry) return;
    
    set((state) => ({
      archives: [
        {
          id: Date.now().toString(),
          timestamp: Date.now(),
          diaryEntry,
          messages: [...state.messages],
        },
        ...state.archives,
      ],
    }));
  },

  deleteArchive: (id) => set((state) => ({
    archives: state.archives.filter((entry) => entry.id !== id)
  })),

  resetSession: () => set({
    messages: [
      {
        id: 'init',
        role: 'model',
        text: '你好。我是你的心灵日记。告诉我你的心事，我会静静倾听。',
        timestamp: Date.now(),
      },
    ],
    diaryEntry: null,
    transcript: '',
  }),
}));