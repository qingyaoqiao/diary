import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const ChatInterface = () => {
  const { messages, isRecording, transcript, isProcessing } = useStore();
  const { toggleRecording } = useSpeechRecognition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, transcript]);

  return (
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 md:p-8">
      
      {/* Header */}
      <header className="flex justify-between items-center pointer-events-auto">
        <h1 className="text-2xl font-light tracking-widest text-white/80 uppercase">Soul Diary</h1>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto my-8 pointer-events-auto space-y-4 pr-2 scrollbar-hide max-w-2xl mx-auto w-full mask-image-gradient"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-6 py-4 backdrop-blur-md border ${
                msg.role === 'user'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-black/40 border-purple-500/30 text-purple-100'
              } shadow-lg transition-all duration-500 animate-fade-in`}
            >
              <p className="text-sm md:text-base leading-relaxed font-light">{msg.text}</p>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isProcessing && (
          <div className="flex justify-start">
             <div className="bg-black/40 border border-purple-500/30 rounded-2xl px-6 py-4 backdrop-blur-md">
                <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
             </div>
          </div>
        )}

        {/* Live Transcript (Current User Input) */}
        {transcript && isRecording && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl px-6 py-4 backdrop-blur-md border bg-white/5 border-white/10 text-white/70 italic">
               <p className="text-sm md:text-base">{transcript}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center pointer-events-auto pb-6">
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`
            relative group flex items-center justify-center w-20 h-20 rounded-full 
            border transition-all duration-300 focus:outline-none
            ${isRecording 
              ? 'bg-red-500/20 border-red-400 text-red-100 scale-110' 
              : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {/* Animated rings when recording */}
          {isRecording && (
            <>
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
              <span className="absolute inline-flex h-3/4 w-3/4 rounded-full bg-red-400 opacity-20 animate-pulse"></span>
            </>
          )}

          {/* Icon */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-8 h-8 z-10"
          >
            {isRecording ? (
                // Stop Icon
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            ) : (
                // Microphone Icon
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/20 text-xs pointer-events-none">
        {isRecording ? "Listening..." : "Tap to speak to your Soul Diary"}
      </div>

    </div>
  );
};

export default ChatInterface;