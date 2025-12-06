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
      recognition.lang = 'en-US';

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
        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setRecording(false);
      };

      recognition.onend = () => {
        // If we were recording and it stopped automatically (or manually), trigger send logic
        if (isRecording) {
            // Note: We usually handle logic in toggleRecording, but this is a safety net
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
          recognitionRef.current.start();
        } catch (e) {
          console.log("Recognition already started");
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