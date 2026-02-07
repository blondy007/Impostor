
import React from 'react';
import { Player, Role } from '../types';
import FitSingleLineText from '../components/FitSingleLineText';

interface Props {
  players: Player[];
  secretWord: string;
  onHome: () => void;
  onBack: () => void;
}

const GameOverScreen: React.FC<Props> = ({ players, secretWord, onHome, onBack }) => {
  const impostors = players.filter(p => p.role === Role.IMPOSTOR);
  const winners = impostors.every(i => i.isEliminated) ? Role.CIVIL : Role.IMPOSTOR;

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-700">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="text-center py-6">
        <h2 className="text-[10px] font-bold text-slate-500 tracking-[0.4em] uppercase mb-2">Partida Finalizada</h2>
        <h3 className={`text-6xl font-black tracking-tighter italic ${winners === Role.CIVIL ? 'text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
           ¡{winners === Role.CIVIL ? 'CIVILES' : 'IMPOSTOR'} GANAN!
        </h3>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center mb-8">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Palabra Secreta</span>
        <div className="mt-1">
          <FitSingleLineText
            text={secretWord}
            minSizePx={14}
            maxSizePx={52}
            className="font-black text-white tracking-widest italic uppercase"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Roles de la partida</h4>
        {players.map(p => (
          <div key={p.id} className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-colors ${p.role === Role.IMPOSTOR ? 'bg-red-900/10 border-red-800/30' : 'bg-slate-900/50 border-slate-800'}`}>
            <div className="flex flex-col">
              <span className={`font-black tracking-tight ${p.isEliminated ? 'text-slate-600 line-through' : 'text-white'}`}>{p.name}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${p.role === Role.IMPOSTOR ? 'text-red-500' : 'text-slate-500'}`}>{p.role}</span>
            </div>
            {p.isEliminated && <span className="text-[10px] font-black bg-slate-800 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">Eliminado</span>}
          </div>
        ))}
      </div>

      <div className="pt-8">
        <button 
          onClick={onHome}
          className="w-full bg-white text-slate-950 p-6 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all"
        >
          Nueva Palabra
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
