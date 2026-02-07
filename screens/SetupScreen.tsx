
import React, { useState, useEffect, useRef } from 'react';
import { GameConfig, Difficulty } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  onBack: () => void;
  onStart: (config: GameConfig, playerNames: string[]) => void;
}

const SetupScreen: React.FC<Props> = ({ onBack, onStart }) => {
  const [playerCount, setPlayerCount] = useState(7);
  const [impostorCount, setImpostorCount] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [view, setView] = useState<'config' | 'names'>('config');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const requestedNames = ['Perea', 'Mario', 'Charlie', 'Raquel', 'Lauri', 'May', 'Iván'];
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(' ');
        
        processTranscriptWithGemini(transcript);
        stopListening();
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processTranscriptWithGemini = async (text: string) => {
    setIsProcessingVoice(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza este dictado de nombres: "${text}". Devuelve solo un array JSON de strings con los nombres limpios.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const detectedNames = JSON.parse(response.text || "[]");
      if (detectedNames.length > 0) {
        setPlayerNames(detectedNames.slice(0, playerCount));
      }
    } catch (error) {
      console.error("Gemini error:", error);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleNext = () => {
    const initialNames = Array.from({ length: playerCount }, (_, i) => {
      return requestedNames[i] || `Agente ${i + 1}`;
    });
    setPlayerNames(initialNames);
    setView('names');
  };

  const handleBackAction = () => {
    if (view === 'names') {
      setView('config');
    } else {
      onBack();
    }
  };

  const updateName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = async () => {
    if (isStarting) return;
    setIsStarting(true);
    
    const config: GameConfig = {
      playerCount,
      impostorCount,
      difficulty,
      categories: [],
      timerEnabled: true,
      timerSeconds: 60,
      winCondition: 'TWO_LEFT'
    };
    
    // Llamamos a la función de inicio de App.tsx
    try {
      await onStart(config, playerNames);
    } catch (e) {
      console.error("Error starting game:", e);
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
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 block">Número de Agentes</label>
            <div className="flex items-center gap-6">
              <span className="text-5xl font-black text-white italic w-16 text-center">{playerCount}</span>
              <input 
                type="range" min="3" max="20" step="1" 
                value={playerCount} 
                onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                className="flex-1 h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Infiltrados</label>
            <div className="flex gap-3">
              {[1, 2, 3].map(num => (
                <button 
                  key={num}
                  onClick={() => setImpostorCount(num)}
                  disabled={num >= playerCount - 1}
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
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dificultad de la Misión</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(Difficulty).map(d => (
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

          <button 
            onClick={handleNext}
            className="w-full bg-white text-slate-950 p-6 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all"
          >
            Siguiente: Identificar Agentes
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-6">
          <div className="flex justify-between items-center bg-indigo-950/20 p-4 rounded-3xl border border-indigo-500/30">
            <div className="pl-2">
              <p className="text-white font-black italic tracking-tighter">¿ESTÁ EL EQUIPO LISTO?</p>
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

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {playerNames.map((name, i) => (
              <div key={i} className="flex gap-3 group animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600">{i + 1}</span>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => updateName(i, e.target.value)}
                    className="w-full bg-slate-900 border-2 border-slate-800 pl-10 pr-4 py-4 rounded-2xl font-black text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleStartGame}
            disabled={isProcessingVoice || isStarting}
            className="w-full bg-indigo-600 p-6 rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-900/40 disabled:opacity-50 active:scale-95 transition-all"
          >
            {isStarting ? 'INICIANDO MISIÓN...' : isProcessingVoice ? 'PROCESANDO...' : '¡A JUGAR!'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SetupScreen;
