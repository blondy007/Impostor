import React, { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { INITIAL_WORDS } from '../constants';
import { normalizeGameConfig } from '../gameConfig';
import { Difficulty, GameConfig } from '../types';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;
const USED_WORDS_SESSION_KEY = 'impostor_used_local_words_v1';

interface PlayerDraft {
  id: string;
  name: string;
}

interface Props {
  onBack: () => void;
  onStart: (config: GameConfig, playerNames: string[]) => void | Promise<void>;
  initialConfig: GameConfig;
}

interface SortablePlayerRowProps {
  draft: PlayerDraft;
  index: number;
  canRemove: boolean;
  onNameChange: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

const createDraftId = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const SortablePlayerRow: React.FC<SortablePlayerRowProps> = ({ draft, index, canRemove, onNameChange, onRemove }) => {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({ id: draft.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex gap-2 animate-in slide-in-from-left duration-300 ${isDragging ? 'z-20 opacity-70' : ''}`}>
      <div className="flex-1 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600">{index + 1}</span>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => onNameChange(draft.id, e.target.value)}
          className="w-full bg-slate-900 border-2 border-slate-800 pl-10 pr-4 py-4 rounded-2xl font-black text-white focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onRemove(draft.id)}
          disabled={!canRemove}
          className="p-2 rounded-xl border border-red-900/40 bg-red-950/30 text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Eliminar ${draft.name || `jugador ${index + 1}`}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-grab active:cursor-grabbing touch-none"
          aria-label={`Arrastrar ${draft.name || `jugador ${index + 1}`}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 4a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm4-12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const SetupScreen: React.FC<Props> = ({ onBack, onStart, initialConfig }) => {
  const normalizedInitialConfig = useMemo(() => normalizeGameConfig(initialConfig), [initialConfig]);
  const [playerCount, setPlayerCount] = useState(normalizedInitialConfig.playerCount);
  const [impostorCount, setImpostorCount] = useState(normalizedInitialConfig.impostorCount);
  const [difficulty, setDifficulty] = useState<Difficulty>(normalizedInitialConfig.difficulty);
  const [voteMode, setVoteMode] = useState<'INDIVIDUAL' | 'GROUP'>(normalizedInitialConfig.voteMode);
  const [clueCaptureEnabled, setClueCaptureEnabled] = useState(normalizedInitialConfig.clueCaptureEnabled);
  const [timerEnabled, setTimerEnabled] = useState(normalizedInitialConfig.timerEnabled);
  const [timerSeconds, setTimerSeconds] = useState(normalizedInitialConfig.timerSeconds);
  const [winCondition, setWinCondition] = useState<'TWO_LEFT' | 'PARITY'>(normalizedInitialConfig.winCondition);
  const [categories, setCategories] = useState<string[]>(normalizedInitialConfig.categories);
  const [playerDrafts, setPlayerDrafts] = useState<PlayerDraft[]>([]);
  const [view, setView] = useState<'config' | 'names'>('config');
  const [isStarting, setIsStarting] = useState(false);

  const requestedNames = ['Perea', 'Mario', 'Raquel', 'Lauri', 'May', 'Ivan', 'Charlie'];
  const maxImpostors = Math.max(1, Math.min(3, playerCount - 2));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 10 } })
  );

  const playerIds = useMemo(() => playerDrafts.map((draft) => draft.id), [playerDrafts]);
  const exhaustedDifficulties = useMemo(() => {
    const totalByDifficulty: Record<Difficulty, number> = {
      [Difficulty.EASY]: 0,
      [Difficulty.MEDIUM]: 0,
      [Difficulty.HARD]: 0,
      [Difficulty.EXTREME]: 0,
    };

    INITIAL_WORDS.forEach((word) => {
      totalByDifficulty[word.difficulty] += 1;
    });

    const usedByDifficulty: Record<Difficulty, Set<string>> = {
      [Difficulty.EASY]: new Set<string>(),
      [Difficulty.MEDIUM]: new Set<string>(),
      [Difficulty.HARD]: new Set<string>(),
      [Difficulty.EXTREME]: new Set<string>(),
    };

    if (typeof window !== 'undefined') {
      try {
        const raw = window.sessionStorage.getItem(USED_WORDS_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Record<Difficulty, string[]>>;
          (Object.values(Difficulty) as Difficulty[]).forEach((d) => {
            usedByDifficulty[d] = new Set(parsed[d] || []);
          });
        }
      } catch {
        // Ignore malformed session payload and keep defaults.
      }
    }

    return (Object.values(Difficulty) as Difficulty[]).reduce<Record<Difficulty, boolean>>((acc, d) => {
      acc[d] = usedByDifficulty[d].size >= totalByDifficulty[d];
      return acc;
    }, {
      [Difficulty.EASY]: false,
      [Difficulty.MEDIUM]: false,
      [Difficulty.HARD]: false,
      [Difficulty.EXTREME]: false,
    });
  }, []);

  const getDefaultName = (index: number) => requestedNames[index] || `Agente ${index + 1}`;

  useEffect(() => {
    if (impostorCount > maxImpostors) {
      setImpostorCount(maxImpostors);
    }
  }, [impostorCount, maxImpostors]);

  useEffect(() => {
    setPlayerCount(normalizedInitialConfig.playerCount);
    setImpostorCount(normalizedInitialConfig.impostorCount);
    setDifficulty(normalizedInitialConfig.difficulty);
    setVoteMode(normalizedInitialConfig.voteMode);
    setClueCaptureEnabled(normalizedInitialConfig.clueCaptureEnabled);
    setTimerEnabled(normalizedInitialConfig.timerEnabled);
    setTimerSeconds(normalizedInitialConfig.timerSeconds);
    setWinCondition(normalizedInitialConfig.winCondition);
    setCategories(normalizedInitialConfig.categories);
  }, [normalizedInitialConfig]);

  useEffect(() => {
    if (!exhaustedDifficulties[difficulty]) return;
    const firstAvailable = (Object.values(Difficulty) as Difficulty[]).find((d) => !exhaustedDifficulties[d]);
    if (firstAvailable) {
      setDifficulty(firstAvailable);
    }
  }, [difficulty, exhaustedDifficulties]);

  const handleNext = () => {
    const nextDrafts = Array.from({ length: playerCount }, (_, i) => {
      const existing = playerDrafts[i];
      return {
        id: existing?.id || createDraftId(),
        name: existing?.name?.trim() || getDefaultName(i),
      };
    });

    setPlayerDrafts(nextDrafts);
    setView('names');
  };

  const handleBackAction = () => {
    if (view === 'names') {
      setView('config');
      return;
    }
    onBack();
  };

  const updateName = (id: string, name: string) => {
    setPlayerDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, name } : draft)));
  };

  const removePlayer = (id: string) => {
    setPlayerDrafts((current) => {
      if (current.length <= MIN_PLAYERS) return current;
      const updated = current.filter((draft) => draft.id !== id);
      setPlayerCount(updated.length);
      return updated;
    });
  };

  const addPlayer = () => {
    setPlayerDrafts((current) => {
      if (current.length >= MAX_PLAYERS) return current;
      const updated = [...current, { id: createDraftId(), name: getDefaultName(current.length) }];
      setPlayerCount(updated.length);
      return updated;
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    setPlayerDrafts((current) => {
      const oldIndex = current.findIndex((draft) => draft.id === active.id);
      const newIndex = current.findIndex((draft) => draft.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const handleStartGame = async () => {
    if (isStarting) return;
    setIsStarting(true);

    const normalizedNames = playerDrafts.map((draft, i) => {
      const trimmed = draft.name.trim();
      return trimmed.length > 0 ? trimmed : getDefaultName(i);
    });

    const safeImpostorCount = Math.min(impostorCount, Math.max(1, normalizedNames.length - 2));

    const config = normalizeGameConfig({
      playerCount: normalizedNames.length,
      impostorCount: safeImpostorCount,
      difficulty,
      categories: [...categories],
      voteMode,
      clueCaptureEnabled,
      timerEnabled,
      timerSeconds,
      winCondition,
    });

    try {
      await onStart(config, normalizedNames);
    } catch (error: any) {
      console.error('Error starting game:', error);
      if (error?.message === 'WORD_SELECTION_CANCELLED') {
        setView('config');
      }
      setIsStarting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center mb-8">
        <button onClick={handleBackAction} className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-3xl font-black ml-4 tracking-tighter italic uppercase">Reclutamiento</h2>
      </div>

      {view === 'config' ? (
        <div className="space-y-8">
          <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 block">Numero de agentes</label>
            <div className="flex items-center gap-6">
              <span className="text-5xl font-black text-white italic w-16 text-center">{playerCount}</span>
              <input
                type="range"
                min={MIN_PLAYERS}
                max={MAX_PLAYERS}
                step="1"
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value, 10))}
                className="flex-1 h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Infiltrados</label>
            <div className="flex gap-3">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setImpostorCount(num)}
                  disabled={num > maxImpostors}
                  className={`flex-1 p-5 rounded-3xl font-black text-xl border-4 transition-all ${
                    impostorCount === num
                      ? 'bg-red-600/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dificultad de la mision</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(Difficulty).map((d) => (
                <button
                  key={d}
                  disabled={exhaustedDifficulties[d]}
                  onClick={() => setDifficulty(d)}
                  className={`p-4 rounded-2xl font-bold border-2 transition-all ${
                    exhaustedDifficulties[d]
                      ? 'bg-slate-900 border-slate-800 text-slate-600 line-through decoration-2 cursor-not-allowed opacity-60'
                      : difficulty === d
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title={exhaustedDifficulties[d] ? 'Sin palabras disponibles en esta sesion' : undefined}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modo de votacion</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVoteMode('INDIVIDUAL')}
                className={`p-4 rounded-2xl font-bold border-2 transition-all ${
                  voteMode === 'INDIVIDUAL' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setVoteMode('GROUP')}
                className={`p-4 rounded-2xl font-bold border-2 transition-all ${
                  voteMode === 'GROUP' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                Grupo
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Condicion de victoria</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWinCondition('TWO_LEFT')}
                className={`p-4 rounded-2xl font-bold border-2 transition-all ${
                  winCondition === 'TWO_LEFT' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                2 Restantes
              </button>
              <button
                type="button"
                onClick={() => setWinCondition('PARITY')}
                className={`p-4 rounded-2xl font-bold border-2 transition-all ${
                  winCondition === 'PARITY' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                Paridad
              </button>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Temporizador de debate</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  {timerEnabled ? `${timerSeconds}s por ronda` : 'Sin limite'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTimerEnabled((prev) => !prev)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full border p-1 transition-colors ${
                  timerEnabled ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-800 border-slate-700'
                }`}
                aria-label="Activar o desactivar temporizador de debate"
              >
                <span
                  className={`absolute left-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white transition-transform ${
                    timerEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {timerEnabled && (
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Duracion (segundos)</label>
                <div className="flex items-center gap-4">
                  <span className="w-14 text-center text-2xl font-black text-white">{timerSeconds}</span>
                  <input
                    type="range"
                    min={15}
                    max={180}
                    step={5}
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(parseInt(e.target.value, 10))}
                    className="flex-1 h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Registro de pistas</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Opcional (recomendado online)</p>
              </div>
              <button
                type="button"
                onClick={() => setClueCaptureEnabled((prev) => !prev)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full border p-1 transition-colors ${
                  clueCaptureEnabled ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-800 border-slate-700'
                }`}
                aria-label="Activar o desactivar registro de pistas"
              >
                <span
                  className={`absolute left-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white transition-transform ${
                    clueCaptureEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <button onClick={handleNext} className="w-full bg-white text-slate-950 p-6 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all">
            Siguiente: Identificar agentes
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-6">
          <div className="bg-indigo-950/20 p-4 rounded-3xl border border-indigo-500/30">
            <p className="text-white font-black italic tracking-tighter">¿Esta el equipo listo?</p>
            <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-widest">Revisa los nombres y ordena la mesa</p>
          </div>

          <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-500">Arrastra el icono de puntos para ordenar la mesa</p>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={playerIds} strategy={verticalListSortingStrategy}>
                {playerDrafts.map((draft, i) => (
                  <SortablePlayerRow
                    key={draft.id}
                    draft={draft}
                    index={i}
                    canRemove={playerDrafts.length > MIN_PLAYERS}
                    onNameChange={updateName}
                    onRemove={removePlayer}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={addPlayer}
              disabled={playerDrafts.length >= MAX_PLAYERS}
              className="w-full bg-slate-900 p-4 rounded-2xl border border-dashed border-slate-700 text-slate-300 font-black text-xs uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              + Anadir agente
            </button>
            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-500">{playerDrafts.length} agentes en mesa</p>
          </div>

          <button
            onClick={handleStartGame}
            disabled={isStarting || playerDrafts.length < MIN_PLAYERS}
            className="w-full bg-indigo-600 p-6 rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-900/40 disabled:opacity-50 active:scale-95 transition-all"
          >
            {isStarting ? 'INICIANDO MISION...' : '¡A JUGAR!'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SetupScreen;
