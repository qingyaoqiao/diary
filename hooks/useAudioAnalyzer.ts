import { useEffect, useRef } from 'react';

export const useAudioAnalyzer = (isListening: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAudio = async () => {
      if (isListening) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          if (!mounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          streamRef.current = stream;
          
          // Create AudioContext only after we have the stream to ensure consistency
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
      }
    };

    initAudio();

    return () => {
      mounted = false;
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const ctx = audioContextRef.current;
      if (ctx) {
        audioContextRef.current = null; // Detach immediately to prevent double-close
        
        // Even if state isn't closed, close() might throw if it's already closing or in a race.
        // We catch and ignore the specific "closed" error.
        if (ctx.state !== 'closed') {
           ctx.close().catch(error => {
              const msg = error ? (error.message || error.toString()) : '';
              if (msg.includes('closed') || error.name === 'InvalidStateError') {
                 return; // Context already closed, ignore.
              }
              console.warn("AudioContext close error", error);
           });
        }
      }
      
      analyserRef.current = null;
      sourceRef.current = null;
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