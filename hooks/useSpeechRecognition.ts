import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { sendMessageToGemini } from '../services/geminiService';

export const useSpeechRecognition = () => {
  const recognitionRef = useRef<any>(null);
  const { 
    isRecording, 
    setRecording, 
    setTranscript, 
    addMessage, 
    setProcessing, 
    messages,
    clearTranscript
  } = useStore();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Change language to Chinese
      recognition.lang = 'zh-CN';

      recognition.onstart = () => {
        console.log('Voice recognition started');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Update UI with current speech
        useStore.getState().setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event: any) => {
        const error = event.error;
        
        // Ignore "no-speech" as it just means silence
        if (error === 'no-speech') return;

        // Handle network errors gracefully
        if (error === 'network') {
             console.log('Speech recognition network error - stopping recording');
             useStore.getState().setRecording(false);
             return;
        }

        if (error === 'not-allowed' || error === 'service-not-allowed') {
             console.warn('Speech recognition not allowed');
             useStore.getState().setRecording(false);
             return;
        }
        
        console.warn('Speech recognition error:', error);
      };

      recognition.onend = () => {
        // If the recognition stops but our store thinks we are recording, 
        // it might be a silence timeout or network drop.
        const currentIsRecording = useStore.getState().isRecording;
        if (currentIsRecording) {
            useStore.getState().setRecording(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      if (isRecording) {
        try {
          // Check if already started implicitly (difficult), so wrap in try-catch
          recognitionRef.current.start();
        } catch (e) {
          // Ignore "already started" errors
        }
      } else {
        recognitionRef.current.stop();
      }
    }
  }, [isRecording]);

  const handleStopAndSend = async () => {
    const transcript = useStore.getState().transcript; // Get latest from store
    setRecording(false);
    
    if (!transcript.trim()) return;

    addMessage('user', transcript);
    clearTranscript();
    setProcessing(true);

    const response = await sendMessageToGemini(messages, transcript);
    addMessage('model', response);
    setProcessing(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      handleStopAndSend();
    } else {
      clearTranscript();
      setRecording(true);
    }
  };

  return { toggleRecording };
};