import React from 'react';
import Scene from './components/Scene';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans selection:bg-purple-500/30">
      <Scene />
      <ChatInterface />
    </div>
  );
};

export default App;