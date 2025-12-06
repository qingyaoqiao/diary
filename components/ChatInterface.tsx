import React, { useEffect, useRef, useState } from 'react';
import { useStore, ArchivedEntry } from '../store/useStore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { generateDiaryEntry } from '../services/geminiService';

const ChatInterface = () => {
  const { 
    messages, 
    isRecording, 
    transcript, 
    isProcessing, 
    setBackgroundImage,
    diaryEntry,
    setDiaryEntry,
    setProcessing,
    resetSession,
    archiveCurrentSession,
    archives,
    deleteArchive
  } = useStore();
  
  const { toggleRecording } = useSpeechRecognition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, transcript]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setBackgroundImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEndSession = async () => {
    if (isProcessing) return;
    setProcessing(true);
    try {
      const entry = await generateDiaryEntry(messages);
      setDiaryEntry(entry);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const downloadDiaryFile = () => {
    if (!diaryEntry) return;
    
    const dateStr = new Date().toLocaleString();
    const conversationLog = messages
      .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role === 'user' ? '我' : 'Soul Diary'}: ${m.text}`)
      .join('\n');

    const fileContent = `Soul Diary - 灵魂日记
记录时间: ${dateStr}

================================
今日篇章 (AI Summary)
================================

${diaryEntry}

================================
对话细节 (Conversation Log)
================================

${conversationLog}
`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SoulDiary_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (window.confirm("确定要开始新的篇章吗？\n\n系统将：\n1. 自动下载当前日记副本\n2. 将记录归档至历史记录\n3. 开启新的对话")) {
        // 1. Download
        downloadDiaryFile();
        // 2. Archive to store
        archiveCurrentSession();
        // 3. Reset
        resetSession();
    }
  };

  // ----------------------------------------------------------------
  // RENDER: HISTORY VIEW
  // ----------------------------------------------------------------
  if (showHistory) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-4xl bg-gray-900/50 border border-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-12 shadow-2xl h-[80vh] flex flex-col">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
             <h2 className="text-2xl md:text-3xl font-light text-white tracking-widest">时光机 Archives</h2>
             <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white/70">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
            {archives.length === 0 ? (
                <div className="text-center text-white/30 py-20 font-light">
                    暂无历史记录，去创造一些回忆吧。
                </div>
            ) : (
                archives.map((archive) => (
                    <div key={archive.id} className="group bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-purple-300 text-xs font-mono uppercase tracking-widest">
                                    {new Date(archive.timestamp).toLocaleString()}
                                </span>
                                <h3 className="text-xl text-white font-light mt-1 line-clamp-1">
                                    {archive.diaryEntry.split('\n')[0] || "无题"}
                                </h3>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteArchive(archive.id); }}
                                className="text-red-400/50 hover:text-red-400 hover:bg-red-900/20 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="删除此记录"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                        <div className="text-white/60 text-sm font-light leading-relaxed line-clamp-3">
                            {archive.diaryEntry}
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // RENDER: DIARY ENTRY VIEW
  // ----------------------------------------------------------------
  if (diaryEntry) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-2xl bg-white/10 border border-white/20 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh]">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
             <svg className="w-24 h-24 text-purple-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
          </div>

          <h2 className="text-3xl md:text-4xl font-light text-white mb-6 tracking-wider border-b border-white/10 pb-4">
            今日篇章
          </h2>
          
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="whitespace-pre-wrap font-light leading-relaxed text-gray-200">
              {diaryEntry}
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center items-center">
             <button 
                onClick={handleReset}
                className="px-8 py-3 bg-white text-black hover:bg-gray-200 rounded-full font-medium transition-colors shadow-lg shadow-white/10 w-full md:w-auto text-center"
             >
                下载并开始新的日记
             </button>
             
             <button
                onClick={() => { archiveCurrentSession(); resetSession(); }}
                className="px-6 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full text-sm transition-colors w-full md:w-auto"
             >
                 仅开始新日记 (不下载)
             </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // RENDER: CHAT INTERFACE
  // ----------------------------------------------------------------
  return (
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 md:p-8">
      
      {/* Header */}
      <header className="flex justify-between items-center pointer-events-auto w-full">
        <h1 className="text-2xl font-light tracking-widest text-white/80 uppercase hidden md:block">Soul Diary</h1>
        
        <div className="flex items-center gap-3">
            {/* History Button */}
            <button 
                onClick={() => setShowHistory(true)}
                className="bg-white/5 hover:bg-white/15 backdrop-blur-md border border-white/10 text-white/80 p-2 rounded-full transition-all"
                title="历史记录"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            {/* Image Upload Button */}
            <div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs px-4 py-2 rounded-full transition-all flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="hidden sm:inline">上传背景</span>
            </button>
            </div>
        </div>
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
      <div className="flex flex-col justify-center items-center pointer-events-auto pb-6 space-y-4">
        
        {/* Record Button */}
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
          {isRecording && (
            <>
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
              <span className="absolute inline-flex h-3/4 w-3/4 rounded-full bg-red-400 opacity-20 animate-pulse"></span>
            </>
          )}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-8 h-8 z-10"
          >
            {isRecording ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>

        {/* End Session Button (Only shows after user has spoken at least once) */}
        {messages.length > 2 && !isRecording && (
           <button 
             onClick={handleEndSession}
             disabled={isProcessing}
             className="text-sm text-purple-200/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all flex items-center gap-2 border border-transparent hover:border-white/20"
           >
             {isProcessing ? (
                <span className="animate-pulse">正在生成...</span>
             ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  结束并生成日记
                </>
             )}
           </button>
        )}
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/20 text-xs pointer-events-none">
        {isRecording ? "正在聆听..." : (messages.length > 2 ? "点击上方按钮结束对话" : "点击按钮，倾诉你的心事")}
      </div>

    </div>
  );
};

export default ChatInterface;