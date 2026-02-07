
import React, { useState } from 'react';
import { Player } from '../types';

interface Props {
  players: Player[];
  onVoteFinished: (expelledId: string) => void;
  onBack: () => void;
}

const VoteScreen: React.FC<Props> = ({ players, onVoteFinished, onBack }) => {
  const activePlayers = players.filter(p => !p.isEliminated);
  const [voterIndex, setVoterIndex] = useState(0);
  const [isPrivate, setIsPrivate] = useState(true);
  const [votes, setVotes] = useState<Record<string, number>>({});

  const currentVoter = activePlayers[voterIndex];

  const handleVote = (targetId: string) => {
    const newVotes = { ...votes };
    newVotes[targetId] = (newVotes[targetId] || 0) + 1;
    setVotes(newVotes);

    if (voterIndex === activePlayers.length - 1) {
      let maxVotes = -1;
      let expelledId = '';
      Object.entries(newVotes).forEach(([id, count]) => {
        const voteCount = count as number;
        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          expelledId = id;
        }
      });
      onVoteFinished(expelledId);
    } else {
      setVoterIndex(voterIndex + 1);
      setIsPrivate(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-3xl font-black italic ml-4 uppercase tracking-tighter">Votación</h2>
      </div>

      {isPrivate ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Turno de Voto Privado</h3>
            <h4 className="text-4xl font-black text-indigo-400 italic tracking-tighter">{currentVoter.name}</h4>
          </div>
          <button 
            onClick={() => setIsPrivate(false)}
            className="bg-indigo-600 p-8 rounded-full border-4 border-indigo-500/50 shadow-2xl shadow-indigo-600/30 font-bold text-lg active:scale-90 transition-all flex items-center justify-center w-24 h-24 mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <p className="text-slate-600 text-sm px-10">Pulsa el botón solo cuando tengas el dispositivo en tus manos.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <p className="text-center text-slate-400 mb-6 font-medium uppercase tracking-widest text-[10px]">¿Quién es el impostor, <span className="text-white font-bold">{currentVoter.name}</span>?</p>
          {activePlayers.map(p => (
            <button 
              key={p.id}
              onClick={() => handleVote(p.id)}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 p-5 rounded-2xl flex justify-between items-center group active:scale-[0.98] transition-all"
            >
              <span className="font-bold text-lg text-slate-300">{p.name}</span>
              <div className="w-8 h-8 rounded-full border-2 border-slate-700 group-hover:border-indigo-500 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full group-hover:bg-indigo-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoteScreen;
