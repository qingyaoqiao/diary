import React from 'react';

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

// Global declaration for Web Speech API and React Three Fiber elements
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }

  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      shaderMaterial: any;
      fog: any;
      ambientLight: any;
    }
  }
}

// Module augmentation for React's JSX namespace
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      shaderMaterial: any;
      fog: any;
      ambientLight: any;
    }
  }
}
