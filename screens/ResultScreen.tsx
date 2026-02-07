
import React from 'react';
import { Player, Role } from '../types';

interface Props {
  expelled: Player | null;
  onNextRound: () => void;
  onBack: () => void;
}

const ResultScreen: React.FC<Props> = ({ expelled, onNextRound, onBack }) => {
  if (!expelled) return null;

  return (
    <div className="flex-1 flex flex-col animate-in zoom-in duration-500">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-slate-500 uppercase tracking-widest mb-6 italic">Veredicto</h2>
        
        <div className="bg-slate-900 border border-slate-800 w-full p-10 rounded-[40px] space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600 opacity-50"></div>
          <div className="space-y-2">
            <h3 className="text-5xl font-black text-white italic tracking-tighter">{expelled.name}</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm italic">HA SIDO EXPULSADO/A</p>
          </div>

          <div className={`p-6 rounded-3xl border-2 ${expelled.role === Role.IMPOSTOR ? 'bg-green-600/10 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-red-600/10 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}>
            <span className="text-[10px] block font-bold tracking-widest mb-1 uppercase">Identidad Revelada</span>
            <h4 className="text-4xl font-black tracking-tighter italic">{expelled.role}</h4>
          </div>
        </div>

        <div className="mt-12 w-full">
          <button 
            onClick={onNextRound}
            className="w-full bg-indigo-600 p-6 rounded-[2rem] font-black text-xl shadow-lg active:scale-95 transition-all"
          >
            Siguiente Ronda
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
