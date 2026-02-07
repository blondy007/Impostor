import React, { useMemo } from 'react';
import { Player, ScoreRoundLog } from '../types';

interface Props {
  players: Player[];
  scoreTotals: Record<string, number>;
  scoreHistory: ScoreRoundLog[];
  onClose: () => void;
}

const formatDelta = (value: number) => (value > 0 ? `+${value}` : `${value}`);

const ScoreboardScreen: React.FC<Props> = ({ players, scoreTotals, scoreHistory, onClose }) => {
  const ranking = useMemo(() => {
    return [...players]
      .map((player) => ({
        ...player,
        total: scoreTotals[player.id] || 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [players, scoreTotals]);

  return (
    <div className="absolute inset-0 z-[140] bg-slate-950/92 backdrop-blur-sm flex flex-col p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-indigo-400">Marcador</p>
          <h3 className="text-2xl font-black italic tracking-tight text-white">Conteo de Sesion</h3>
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white border border-slate-700"
          aria-label="Cerrar marcador"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 mb-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Clasificacion</p>
        {ranking.length === 0 ? (
          <p className="text-sm text-slate-500">Todavia no hay jugadores en sesion.</p>
        ) : (
          <div className="space-y-2">
            {ranking.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-2xl px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center text-[10px] font-black text-indigo-400">#{index + 1}</div>
                  <span className={`font-black tracking-tight ${player.isEliminated ? 'text-slate-500 line-through' : 'text-white'}`}>{player.name}</span>
                </div>
                <div className="text-sm font-black text-white">{player.total} pts</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-800 rounded-3xl p-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Historial de rondas</p>
        {scoreHistory.length === 0 ? (
          <p className="text-sm text-slate-500">Aun no hay rondas puntuadas.</p>
        ) : (
          <div className="space-y-3">
            {[...scoreHistory].reverse().map((round) => (
              <div key={`score-round-${round.sessionRound}`} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                    Sesion R{round.sessionRound} - Partida R{round.gameRound}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Expulsado: {round.expelledName} ({round.expelledRole})
                  </p>
                </div>

                <div className="mt-2 space-y-1">
                  {Object.entries(round.deltas)
                    .filter(([, delta]) => delta !== 0)
                    .map(([playerId, delta]) => {
                      const playerName = players.find((p) => p.id === playerId)?.name || playerId;
                      const notes = round.notes[playerId] || [];
                      return (
                        <div key={`${round.sessionRound}-${playerId}`} className="flex items-start justify-between gap-2 text-sm">
                          <div>
                            <p className="font-bold text-slate-200">{playerName}</p>
                            {notes.map((note, i) => (
                              <p key={`${playerId}-note-${i}`} className="text-[10px] text-slate-500 uppercase tracking-wide">
                                {note}
                              </p>
                            ))}
                          </div>
                          <p className={`font-black ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>{formatDelta(delta)} pts</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreboardScreen;
