
import React, { useMemo, useState } from 'react';
import { Difficulty } from '../types';
import { INITIAL_WORDS } from '../constants';

interface Props {
  onBack: () => void;
}

const LibraryScreen: React.FC<Props> = ({ onBack }) => {
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'TODAS'>('TODAS');
  const filterOptions: Array<Difficulty | 'TODAS'> = ['TODAS', ...Object.values(Difficulty)];

  const filtered = useMemo(() => {
    return filterDifficulty === 'TODAS' ? INITIAL_WORDS : INITIAL_WORDS.filter((word) => word.difficulty === filterDifficulty);
  }, [filterDifficulty]);

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-left duration-300">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-3xl font-black ml-4 tracking-tighter italic uppercase">Archivo</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
        {filterOptions.map((d) => (
          <button 
            key={d}
            onClick={() => setFilterDifficulty(d)}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
              filterDifficulty === d ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {filtered.map(w => (
          <div key={w.id} className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex justify-between items-center group hover:border-indigo-500/50 transition-colors">
            <div>
              <p className="font-black text-xl text-white tracking-tight">{w.text}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">
                <span className="text-indigo-500">{w.category}</span> • {w.difficulty}
              </p>
            </div>
            <button className="p-2 text-slate-700 hover:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button className="mt-6 w-full bg-slate-900 p-6 rounded-[2rem] border-2 border-dashed border-slate-800 text-slate-500 font-black text-xs uppercase tracking-[0.2em] hover:border-indigo-500 hover:text-indigo-400 transition-all">
        + Aumentar Base de Datos
      </button>
    </div>
  );
};

export default LibraryScreen;
