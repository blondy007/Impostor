import React, { useEffect, useMemo, useState } from 'react';
import { Player, RoundClue } from '../types';

interface Props {
  players: Player[];
  roundNumber: number;
  clueCaptureEnabled: boolean;
  onCluesFinished: (clues: RoundClue[]) => void;
  onChangeWord: () => void;
  onBack: () => void;
}

const RoundScreen: React.FC<Props> = ({ players, roundNumber, clueCaptureEnabled, onCluesFinished, onChangeWord, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cluesByPlayerId, setCluesByPlayerId] = useState<Record<string, string>>({});
  const [clueInput, setClueInput] = useState('');
  const [clueWarning, setClueWarning] = useState('');

  const orderedTurnList = players;
  const activePlayer = orderedTurnList[currentIndex];

  const buildRoundClues = useMemo(() => {
    return (source: Record<string, string>): RoundClue[] => {
      return orderedTurnList
        .map((player, index) => {
          const text = (source[player.id] || '').trim();
          if (!text) return null;
          return {
            playerId: player.id,
            playerName: player.name,
            text,
            round: roundNumber,
            turnOrder: index + 1,
          };
        })
        .filter((entry): entry is RoundClue => entry !== null);
    };
  }, [orderedTurnList, roundNumber]);

  useEffect(() => {
    if (!activePlayer) return;
    setClueInput(cluesByPlayerId[activePlayer.id] || '');
    setClueWarning('');
  }, [activePlayer, cluesByPlayerId]);

  const handleNextPlayer = () => {
    const currentPlayerId = activePlayer?.id;
    if (!currentPlayerId) return;

    const trimmedClue = clueInput.trim();
    if (clueCaptureEnabled && trimmedClue.length === 0) {
      setClueWarning('Escribe la pista para continuar (modo registro activo).');
      return;
    }

    const nextCluesByPlayerId = {
      ...cluesByPlayerId,
      [currentPlayerId]: trimmedClue,
    };
    setCluesByPlayerId(nextCluesByPlayerId);

    if (currentIndex === orderedTurnList.length - 1) {
      onCluesFinished(buildRoundClues(nextCluesByPlayerId));
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const skipAllTurns = () => {
    onCluesFinished(buildRoundClues(cluesByPlayerId));
  };

  if (!activePlayer) return null;

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="p-2 bg-slate-900 rounded-xl text-slate-400 hover:text-white border border-slate-800 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-white leading-tight">Mision Pista</h2>
          <p className="text-indigo-500 text-[9px] font-black uppercase tracking-widest">Ronda {roundNumber}</p>
        </div>
        <button onClick={onChangeWord} className="text-[9px] font-black text-red-500 border border-red-500/20 px-3 py-1.5 rounded-full uppercase">
          Cambiar palabra
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        <div className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-6 flex flex-col items-center text-center space-y-4 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>

          <div className="bg-indigo-500/10 px-3 py-1 rounded-full">
            <span className="text-[9px] font-black text-indigo-400 tracking-[0.2em] uppercase">
              {currentIndex === 0 ? 'EL ELEGIDO PARA EMPEZAR' : `MESA: TURNO ${currentIndex + 1}`}
            </span>
          </div>

          <h3 className="text-4xl font-black text-white tracking-tighter leading-none italic uppercase">{activePlayer.name}</h3>

          <div className="pt-1 px-2">
            <p className="text-white/80 font-bold text-base leading-tight">
              {currentIndex === 0 ? 'Rompe el hielo.' : 'Pasa el dispositivo.'} <br />
              <span className="text-slate-500 text-xs italic font-normal">
                {clueCaptureEnabled ? 'Da y registra una pista breve.' : 'Da una pista rapida.'}
              </span>
            </p>
          </div>

          {clueCaptureEnabled && (
            <div className="w-full max-w-xs space-y-2">
              <input
                type="text"
                value={clueInput}
                onChange={(event) => setClueInput(event.target.value)}
                placeholder="Escribe la pista de este turno"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {clueWarning && <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">{clueWarning}</p>}
            </div>
          )}

          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${currentIndex === 0 ? 'bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] animate-pulse' : 'bg-slate-800'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 ${currentIndex === 0 ? 'text-white' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={handleNextPlayer} className="w-full bg-white text-slate-950 p-4 rounded-[1.8rem] font-black text-lg active:scale-95 transition-all shadow-lg">
            {currentIndex === orderedTurnList.length - 1 ? 'Finalizar Rondas' : 'Siguiente en la Mesa'}
          </button>

          <button onClick={skipAllTurns} className="w-full bg-slate-950/50 text-slate-500 p-4 rounded-[1.6rem] font-black text-xs uppercase tracking-[0.2em] transition-all border border-slate-800/80">
            Saltar todo
          </button>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="flex justify-center gap-1">
          {orderedTurnList.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= currentIndex ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-800'}`} />
          ))}
        </div>
        <p className="text-[8px] text-slate-600 font-bold uppercase mt-2 tracking-widest">
          {currentIndex + 1} de {orderedTurnList.length}
        </p>
      </div>
    </div>
  );
};

export default RoundScreen;
