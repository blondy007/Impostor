
import React, { useState, useEffect } from 'react';
import { GameConfig } from '../types';

interface Props {
  clues: string[];
  config: GameConfig;
  onVote: () => void;
  onBack: () => void;
}

const DebateScreen: React.FC<Props> = ({ onVote, onBack }) => {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="text-center mb-10">
         <h2 className="text-4xl font-black mb-2 italic tracking-tighter uppercase">Debate</h2>
         <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">¿Quién miente? ¿Quién ha sido demasiado obvio?</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        <div className={`relative w-64 h-64 flex items-center justify-center rounded-full border-[12px] transition-colors duration-1000 ${timeLeft < 10 ? 'border-red-600 animate-pulse' : 'border-indigo-600/20'}`}>
           <div 
              className="absolute inset-0 rounded-full border-[12px] border-indigo-500" 
              style={{ clipPath: `inset(0 0 0 ${100 - (timeLeft/60)*100}%)`, transition: 'clip-path 1s linear' }}
           ></div>
           <span className={`text-7xl font-black tracking-tighter ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>
            {formatTime(timeLeft)}
           </span>
        </div>

        <div className="bg-slate-900/50 border-2 border-slate-800 p-8 rounded-[2.5rem] text-center max-w-xs">
           <p className="text-slate-400 font-medium leading-tight italic">
             "Recordad que las pistas fueron dadas en voz alta. El impostor intentará camuflarse entre los civiles."
           </p>
        </div>
      </div>

      <div className="pt-10">
        <button 
          onClick={onVote}
          className="w-full bg-red-600 hover:bg-red-500 p-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-red-900/40 active:scale-95 transition-all"
        >
          Finalizar y Votar
        </button>
      </div>
    </div>
  );
};

export default DebateScreen;
