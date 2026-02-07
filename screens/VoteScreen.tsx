import React, { useMemo, useState } from 'react';
import { Player, VoteResolution } from '../types';

interface Props {
  players: Player[];
  voteMode: 'INDIVIDUAL' | 'GROUP';
  onVoteFinished: (resolution: VoteResolution) => void;
  onBack: () => void;
}

const VoteScreen: React.FC<Props> = ({ players, voteMode, onVoteFinished, onBack }) => {
  const ABSTAIN_MARKER = '__ABSTAIN__';
  const activePlayers = useMemo(() => players.filter((p) => !p.isEliminated), [players]);
  const isGroupVote = voteMode === 'GROUP';
  const [groupResolutionMode, setGroupResolutionMode] = useState<'UNANIMOUS' | 'INDIVIDUALIZED' | null>(isGroupVote ? null : 'INDIVIDUALIZED');

  const [voterIndex, setVoterIndex] = useState(0);
  const [isPrivate, setIsPrivate] = useState(true);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [votesByVoter, setVotesByVoter] = useState<Record<string, string>>({});
  const [voteWarning, setVoteWarning] = useState<string>('');

  const useIndividualFlow = !isGroupVote || groupResolutionMode === 'INDIVIDUALIZED';
  const useUnanimousGroupFlow = isGroupVote && groupResolutionMode === 'UNANIMOUS';
  const showGroupChoice = isGroupVote && groupResolutionMode === null;
  const currentVoter = activePlayers[voterIndex];

  const resetIndividualState = () => {
    setVoterIndex(0);
    setIsPrivate(true);
    setVotes({});
    setVotesByVoter({});
    setVoteWarning('');
  };

  const enableIndividualizedVotes = () => {
    setGroupResolutionMode('INDIVIDUALIZED');
    resetIndividualState();
  };

  const enableUnanimousGroupVote = () => {
    setGroupResolutionMode('UNANIMOUS');
    resetIndividualState();
  };

  const backToGroupChoice = () => {
    setGroupResolutionMode(null);
    resetIndividualState();
  };

  const finishWithMostVoted = (nextVotes: Record<string, number>, votesByVoter: Record<string, string>) => {
    let maxVotes = -1;
    let expelledId = '';

    Object.entries(nextVotes).forEach(([id, count]) => {
      const voteCount = count as number;
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        expelledId = id;
      }
    });

    if (expelledId) {
      onVoteFinished({
        expelledId,
        mode: 'INDIVIDUAL',
        votesByVoter,
      });
    }
  };

  const advanceAfterVoterAction = (nextVotes: Record<string, number>, nextVotesByVoter: Record<string, string>) => {
    const isLastVoter = voterIndex === activePlayers.length - 1;

    if (isLastVoter) {
      if (Object.keys(nextVotes).length === 0) {
        setVoteWarning('Hace falta al menos un voto para cerrar la ronda.');
        return;
      }
      finishWithMostVoted(nextVotes, nextVotesByVoter);
      return;
    }

    setVoteWarning('');
    setVoterIndex((prev) => prev + 1);
    setIsPrivate(true);
  };

  const handleIndividualVote = (targetId: string) => {
    const newVotes = { ...votes };
    newVotes[targetId] = (newVotes[targetId] || 0) + 1;
    setVotes(newVotes);
    const currentVoterId = currentVoter?.id;
    const nextVotesByVoter = { ...votesByVoter };
    if (currentVoterId) nextVotesByVoter[currentVoterId] = targetId;
    setVotesByVoter(nextVotesByVoter);
    setVoteWarning('');
    advanceAfterVoterAction(newVotes, nextVotesByVoter);
  };

  const handleAbstain = () => {
    const currentVoterId = currentVoter?.id;
    const nextVotesByVoter = { ...votesByVoter };
    if (currentVoterId) nextVotesByVoter[currentVoterId] = ABSTAIN_MARKER;
    setVotesByVoter(nextVotesByVoter);
    advanceAfterVoterAction(votes, nextVotesByVoter);
  };

  if (activePlayers.length === 0) return null;
  if (useIndividualFlow && !currentVoter) return null;

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-3xl font-black italic ml-4 uppercase tracking-tighter">Votacion</h2>
      </div>

      {showGroupChoice ? (
        <div className="flex-1 flex flex-col justify-center gap-4">
          <p className="text-center text-slate-400 mb-2 font-medium uppercase tracking-widest text-[10px]">
            Votacion de grupo: hubo unanimidad?
          </p>

          <button
            onClick={enableUnanimousGroupVote}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 p-5 rounded-2xl text-left transition-all active:scale-[0.98]"
          >
            <p className="font-black text-white uppercase tracking-wide">Si, consenso total</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Un solo resultado de grupo</p>
          </button>

          <button
            onClick={enableIndividualizedVotes}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 p-5 rounded-2xl text-left transition-all active:scale-[0.98]"
          >
            <p className="font-black text-white uppercase tracking-wide">No, registrar votos individuales</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Permite sumar/restar puntos por persona</p>
          </button>
        </div>
      ) : useUnanimousGroupFlow ? (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <p className="text-center text-slate-400 mb-6 font-medium uppercase tracking-widest text-[10px]">Votacion en grupo: seleccionad a quien expulsar</p>
          <button
            onClick={enableIndividualizedVotes}
            className="w-full mb-2 bg-slate-950 border border-slate-800 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-400"
          >
            Sin consenso? pasar a votos individuales
          </button>
          {activePlayers.map((p) => (
            <button
              key={p.id}
              onClick={() =>
                onVoteFinished({
                  expelledId: p.id,
                  mode: 'GROUP',
                  votesByVoter: {},
                })
              }
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 p-5 rounded-2xl flex justify-between items-center group active:scale-[0.98] transition-all"
            >
              <span className="font-bold text-lg text-slate-300">{p.name}</span>
              <div className="px-3 py-1 rounded-full border border-indigo-500/60 text-[10px] font-black uppercase tracking-wider text-indigo-400">Expulsar</div>
            </button>
          ))}
        </div>
      ) : isPrivate ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {isGroupVote ? 'Voto Individualizado' : 'Turno de Voto Privado'}
            </h3>
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
          <p className="text-slate-600 text-sm px-10">Pulsa el boton solo cuando tengas el dispositivo en tus manos.</p>
          {isGroupVote && (
            <button
              onClick={backToGroupChoice}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-800 px-4 py-2 rounded-full"
            >
              Cambiar tipo de voto
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <p className="text-center text-slate-400 mb-6 font-medium uppercase tracking-widest text-[10px]">
            Quien es el impostor, <span className="text-white font-bold">{currentVoter.name}</span>?
          </p>
          {activePlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => handleIndividualVote(p.id)}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 p-5 rounded-2xl flex justify-between items-center group active:scale-[0.98] transition-all"
            >
              <span className="font-bold text-lg text-slate-300">{p.name}</span>
              <div className="w-8 h-8 rounded-full border-2 border-slate-700 group-hover:border-indigo-500 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full group-hover:bg-indigo-500 transition-colors" />
              </div>
            </button>
          ))}
          <button
            onClick={handleAbstain}
            className="w-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700 p-5 rounded-2xl flex justify-between items-center active:scale-[0.98] transition-all"
          >
            <span className="font-bold text-lg text-slate-300">Abstenerse</span>
            <div className="px-3 py-1 rounded-full border border-slate-600 text-[10px] font-black uppercase tracking-wider text-slate-400">Sin voto</div>
          </button>
          {voteWarning && <p className="text-center text-[10px] font-black uppercase tracking-widest text-amber-400">{voteWarning}</p>}
        </div>
      )}
    </div>
  );
};

export default VoteScreen;
