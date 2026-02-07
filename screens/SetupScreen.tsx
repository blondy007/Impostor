import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CATEGORIES } from '../constants';
import { Difficulty, GameConfig } from '../types';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;

interface PlayerDraft {
  id: string;
  name: string;
}

interface Props {
  onBack: () => void;
  onStart: (config: GameConfig, playerNames: string[]) => void | Promise<void>;
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

const SetupScreen: React.FC<Props> = ({ onBack, onStart }) => {
  const [playerCount, setPlayerCount] = useState(7);
  const [impostorCount, setImpostorCount] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [aiWordGenerationEnabled, setAiWordGenerationEnabled] = useState(false);
  const [playerDrafts, setPlayerDrafts] = useState<PlayerDraft[]>([]);
  const [view, setView] = useState<'config' | 'names'>('config');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const requestedNames = ['Perea', 'Mario', 'Charlie', 'Raquel', 'Lauri', 'May', 'Ivan'];
  const recognitionRef = useRef<any>(null);
  const maxImpostors = Math.max(1, Math.min(3, playerCount - 2));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 10 } })
  );

  const playerIds = useMemo(() => playerDrafts.map((draft) => draft.id), [playerDrafts]);

  const getDefaultName = (index: number) => requestedNames[index] || `Agente ${index + 1}`;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'es-ES';

    recognitionRef.current.onresult = async (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ');

      await processTranscriptWithGemini(transcript);
      stopListening();
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };
  }, []);

  useEffect(() => {
    if (impostorCount > maxImpostors) {
      setImpostorCount(maxImpostors);
    }
  }, [impostorCount, maxImpostors]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const processTranscriptWithGemini = async (text: string) => {
    setIsProcessingVoice(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza este dictado de nombres: "${text}". Devuelve solo un array JSON de strings con los nombres limpios.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });

      const detectedNames = JSON.parse(response.text || '[]');
      if (!Array.isArray(detectedNames)) return;

      const normalized = detectedNames
        .map((name: unknown) => (typeof name === 'string' ? name.trim() : ''))
        .filter((name: string) => name.length > 0)
        .slice(0, MAX_PLAYERS);

      if (normalized.length === 0) return;

      while (normalized.length < MIN_PLAYERS) {
        normalized.push(getDefaultName(normalized.length));
      }

      setPlayerDrafts(
        normalized.map((name) => ({
          id: createDraftId(),
          name,
        }))
      );
      setPlayerCount(normalized.length);
    } catch (error) {
      console.error('Gemini error:', error);
    } finally {
      setIsProcessingVoice(false);
    }
  };

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

    const config: GameConfig = {
      playerCount: normalizedNames.length,
      impostorCount: safeImpostorCount,
      difficulty,
      categories: [...CATEGORIES],
      aiWordGenerationEnabled,
      timerEnabled: true,
      timerSeconds: 60,
      winCondition: 'TWO_LEFT',
    };

    try {
      await onStart(config, normalizedNames);
    } catch (error) {
      console.error('Error starting game:', error);
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
                  onClick={() => setDifficulty(d)}
                  className={`p-4 rounded-2xl font-bold border-2 transition-all ${
                    difficulty === d ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Palabra por IA</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Desactivado por defecto</p>
              </div>
              <button
                type="button"
                onClick={() => setAiWordGenerationEnabled((prev) => !prev)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full border p-1 transition-colors ${
                  aiWordGenerationEnabled ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-800 border-slate-700'
                }`}
                aria-label="Activar o desactivar palabra por IA"
              >
                <span
                  className={`absolute left-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white transition-transform ${
                    aiWordGenerationEnabled ? 'translate-x-6' : 'translate-x-0'
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
          <div className="flex justify-between items-center bg-indigo-950/20 p-4 rounded-3xl border border-indigo-500/30">
            <div className="pl-2">
              <p className="text-white font-black italic tracking-tighter">¿Esta el equipo listo?</p>
              <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-widest">Usa el micro para dictar todos</p>
            </div>
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-4 rounded-2xl transition-all shadow-lg ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
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
            disabled={isProcessingVoice || isStarting || playerDrafts.length < MIN_PLAYERS}
            className="w-full bg-indigo-600 p-6 rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-900/40 disabled:opacity-50 active:scale-95 transition-all"
          >
            {isStarting ? 'INICIANDO MISION...' : isProcessingVoice ? 'PROCESANDO...' : '¡A JUGAR!'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SetupScreen;
