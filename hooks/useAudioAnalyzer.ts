import { useEffect, useRef, useState } from 'react';

export const useAudioAnalyzer = (isListening: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      if (isListening) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioContext;

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256; // Trade-off between resolution and performance
          analyserRef.current = analyser;

          const source = audioContext.createMediaStreamSource(stream);
          sourceRef.current = source;
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
        } catch (err) {
          console.error("Error accessing microphone:", err);
        }
      } else {
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
      }
    };

    initAudio();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isListening]);

  // Function to be called inside useFrame for high performance
  const getAudioData = () => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Calculate average volume (0.0 to 1.0)
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      const avg = sum / dataArrayRef.current.length;
      return {
        frequencyData: dataArrayRef.current,
        volume: avg / 255
      };
    }
    return { frequencyData: new Uint8Array(0), volume: 0 };
  };

  return { getAudioData };
};