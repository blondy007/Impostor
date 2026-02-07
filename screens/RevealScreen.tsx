
import React, { useState, useRef } from 'react';
import { Player, Role } from '../types';
import FitSingleLineText from '../components/FitSingleLineText';

interface Props {
  players: Player[];
  secretWord: string;
  onFinished: () => void;
  onBack: () => void;
}

const RevealScreen: React.FC<Props> = ({ players, secretWord, onFinished, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shutterPos, setShutterPos] = useState(0); 
  const [isDragging, setIsDragging] = useState(false);
  const [hasRevealedEnough, setHasRevealedEnough] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const currentPlayer = players[currentIndex];

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    currentY.current = shutterPos;
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = startY.current - clientY;
    const rect = containerRef.current.getBoundingClientRect();
    
    let percentage = (deltaY / rect.height) * 100 + currentY.current;
    percentage = Math.max(0, Math.min(100, percentage));
    
    setShutterPos(percentage);
    if (percentage > 85) setHasRevealedEnough(true);
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (shutterPos < 35) {
      setShutterPos(0);
      setHasRevealedEnough(false);
    } else if (shutterPos > 65) {
      setShutterPos(100);
      setHasRevealedEnough(true);
    }
  };

  const handleNext = () => {
    if (currentIndex === players.length - 1) {
      onFinished();
    } else {
      setCurrentIndex(currentIndex + 1);
      setShutterPos(0);
      setHasRevealedEnough(false);
    }
  };

  if (!currentPlayer) return null;

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-300 select-none touch-none">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4 flex-1">
        <div className="text-center">
          <h3 className="text-indigo-500 uppercase tracking-[0.4em] text-[10px] font-black mb-1">REVELAR ROL</h3>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">{currentPlayer.name}</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Mesa Redonda: Turno {currentIndex + 1}</p>
        </div>

        <div 
          ref={containerRef}
          className="w-full aspect-[4/5] max-w-[280px] relative bg-slate-950 rounded-[3rem] overflow-hidden border-[8px] border-slate-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,1)]"
          onMouseMove={handleMove}
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchMove={handleMove}
          onTouchStart={handleStart}
          onTouchEnd={handleEnd}
        >
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-colors duration-700 ${shutterPos > 40 ? (currentPlayer.role === Role.IMPOSTOR ? 'bg-red-950/20' : 'bg-indigo-950/20') : 'bg-transparent'}`}>
             <div className={`mb-3 p-3 rounded-full border-2 ${currentPlayer.role === Role.IMPOSTOR ? 'bg-red-900/20 border-red-500/30' : 'bg-indigo-900/20 border-indigo-500/30'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${currentPlayer.role === Role.IMPOSTOR ? 'text-red-500' : 'text-indigo-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
             </div>

             <span className="text-[9px] font-black text-slate-500 tracking-[0.3em] mb-1 uppercase">Identidad</span>
             <h4 className={`text-4xl font-black mb-4 italic tracking-tighter ${currentPlayer.role === Role.IMPOSTOR ? 'text-red-500' : 'text-white'}`}>
               {currentPlayer.role}
             </h4>
             
             {currentPlayer.role === Role.CIVIL ? (
               <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl flex flex-col items-center justify-center min-h-[80px]">
                 <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Palabra Secreta</span>
                 <FitSingleLineText
                   text={secretWord}
                   minSizePx={12}
                   maxSizePx={36}
                   className="font-black text-white tracking-widest uppercase"
                 />
               </div>
             ) : (
               <div className="w-full bg-red-900/10 border border-red-500/20 rounded-3xl p-4">
                 <p className="text-[10px] font-black text-red-500 uppercase leading-tight italic tracking-widest">
                   Miente y engaña <br/>para ganar
                 </p>
               </div>
             )}
          </div>

          <div 
            className="absolute inset-0 bg-slate-900 transition-transform duration-150 ease-out z-20"
            style={{ transform: `translateY(-${shutterPos}%)` }}
          >
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, #000 50%)', backgroundSize: '4px 100%' }}></div>
            <div className="h-full flex flex-col items-center justify-end pb-10 relative">
               <div className={`relative w-20 h-20 rounded-full border-4 transition-all duration-300 flex items-center justify-center ${shutterPos > 5 ? 'scale-110 border-indigo-500 bg-indigo-950' : 'border-slate-800 bg-slate-950'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${shutterPos > 5 ? 'text-indigo-400' : 'text-slate-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3c1.268 0 2.39.246 3.44.692m1.273 2.548A10.003 10.003 0 0121 11c0 2.725-.636 5.3-1.765 7.582a10.02 10.02 0 01-3.376 3.376m0-3.376a10 10 0 01-4.69-4.69" />
                  </svg>
               </div>
               <p className={`mt-6 text-[9px] font-black tracking-[0.2em] uppercase transition-colors duration-300 ${shutterPos > 5 ? 'text-indigo-400' : 'text-slate-600'}`}>
                 Desliza hacia arriba
               </p>
            </div>
          </div>
        </div>

        <div className="h-16 w-full flex items-center justify-center">
          {hasRevealedEnough && !isDragging && (
            <button 
              onClick={handleNext}
              className="w-full max-w-[280px] bg-indigo-600 text-white p-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all"
            >
              SIGUIENTE AGENTE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevealScreen;
