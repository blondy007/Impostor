
import React, { useState, useMemo } from 'react';
import { GameState, GameConfig, Difficulty, Player, Role } from './types';
import { INITIAL_WORDS, CATEGORIES } from './constants';
import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import RevealScreen from './screens/RevealScreen';
import RoundScreen from './screens/RoundScreen';
import DebateScreen from './screens/DebateScreen';
import VoteScreen from './screens/VoteScreen';
import ResultScreen from './screens/ResultScreen';
import GameOverScreen from './screens/GameOverScreen';
import LibraryScreen from './screens/LibraryScreen';
import { fetchSecretWord } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [config, setConfig] = useState<GameConfig>({
    playerCount: 7,
    impostorCount: 1,
    difficulty: Difficulty.MEDIUM,
    categories: [...CATEGORIES],
    timerEnabled: false,
    timerSeconds: 30,
    winCondition: 'TWO_LEFT'
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [secretWord, setSecretWord] = useState('');
  const [roundNumber, setRoundNumber] = useState(1);
  const [lastExpelled, setLastExpelled] = useState<Player | null>(null);
  const [gameId, setGameId] = useState(Math.random().toString());

  const resetToHome = () => {
    setGameState(GameState.HOME);
  };

  const getRandomLocalWord = (diff: Difficulty) => {
    const filtered = INITIAL_WORDS.filter(w => w.difficulty === diff);
    const pool = filtered.length > 0 ? filtered : INITIAL_WORDS;
    // Añadimos extra aleatoriedad con el tiempo para evitar patrones de JS
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex].text;
  };

  const startGame = async (newConfig: GameConfig, playerNames: string[]) => {
    try {
      setConfig(newConfig);
      setGameId(Math.random().toString()); // Forzamos nueva instancia de pantallas
      
      const totalPlayers = playerNames.length;
      let roles: Role[] = new Array(totalPlayers).fill(Role.CIVIL);
      let assignedImpostors = 0;
      
      // Asignación de impostores aleatoria
      while (assignedImpostors < newConfig.impostorCount) {
        const idx = Math.floor(Math.random() * totalPlayers);
        if (roles[idx] === Role.CIVIL) {
          roles[idx] = Role.IMPOSTOR;
          assignedImpostors++;
        }
      }

      const initialPlayers: Player[] = playerNames.map((name, i) => ({
        id: `p-${i}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        role: roles[i],
        isEliminated: false,
        votesReceived: 0
      }));

      setPlayers(initialPlayers);
      
      // Intentar obtener palabra de Gemini con alta temperatura
      let word = "";
      try {
        word = await fetchSecretWord(newConfig.difficulty, newConfig.categories);
      } catch (err) {
        console.warn("Gemini falló, usando palabra local");
      }

      if (!word || word.trim() === "") {
        word = getRandomLocalWord(newConfig.difficulty);
      }
      
      setSecretWord(word);
      setRoundNumber(1);
      setGameState(GameState.ROLE_REVEAL);
    } catch (criticalError) {
      console.error("Error crítico al iniciar:", criticalError);
      setGameState(GameState.HOME);
    }
  };

  const handleExpulsion = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, isEliminated: true } : p
    );
    setPlayers(updatedPlayers);
    setLastExpelled(player);

    const activeCivilians = updatedPlayers.filter(p => !p.isEliminated && p.role === Role.CIVIL);
    const activeImpostors = updatedPlayers.filter(p => !p.isEliminated && p.role === Role.IMPOSTOR);

    if (activeImpostors.length === 0) {
      setGameState(GameState.GAME_OVER);
    } else if (config.winCondition === 'TWO_LEFT' && (activeCivilians.length + activeImpostors.length) <= 2) {
      setGameState(GameState.GAME_OVER);
    } else if (config.winCondition === 'PARITY' && activeImpostors.length >= activeCivilians.length) {
      setGameState(GameState.GAME_OVER);
    } else {
      setGameState(GameState.ROUND_RESULT);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen w-full flex flex-col items-center overflow-hidden">
      <div 
        className="max-w-md w-full min-h-screen flex flex-col relative bg-slate-950 text-slate-100 shadow-2xl"
        style={{ 
          transform: 'scale(0.9)', 
          transformOrigin: 'top center',
          height: '111.11%', // Compensación de escala para ocupar el viewport
          maxHeight: '111.11vh'
        }}
      >
        {gameState !== GameState.HOME && gameState !== GameState.SETUP && gameState !== GameState.LIBRARY && (
          <div className="absolute top-4 right-4 z-50">
            <div className="bg-slate-800/90 backdrop-blur border-2 border-slate-700 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase shadow-xl">
              {config.difficulty}
            </div>
          </div>
        )}

        <main className="flex-1 flex flex-col p-6 pb-20 overflow-y-auto custom-scrollbar">
          {gameState === GameState.HOME && (
            <HomeScreen 
              onNewGame={() => setGameState(GameState.SETUP)} 
              onLibrary={() => setGameState(GameState.LIBRARY)}
            />
          )}
          {gameState === GameState.SETUP && (
            <SetupScreen onBack={() => setGameState(GameState.HOME)} onStart={startGame} />
          )}
          {gameState === GameState.ROLE_REVEAL && (
            <RevealScreen 
              key={`reveal-${gameId}`}
              players={players} 
              secretWord={secretWord} 
              onFinished={() => setGameState(GameState.ROUND_CLUES)} 
              onBack={resetToHome}
            />
          )}
          {gameState === GameState.ROUND_CLUES && (
            <RoundScreen 
              key={`round-${roundNumber}-${gameId}`}
              players={players.filter(p => !p.isEliminated)} 
              secretWord={secretWord}
              roundNumber={roundNumber}
              onCluesFinished={() => setGameState(GameState.ROUND_DEBATE)}
              onChangeWord={async () => {
                const w = await fetchSecretWord(config.difficulty, config.categories) || getRandomLocalWord(config.difficulty);
                setSecretWord(w);
              }}
              onBack={resetToHome}
            />
          )}
          {gameState === GameState.ROUND_DEBATE && (
            <DebateScreen 
              key={`debate-${roundNumber}-${gameId}`}
              clues={[]} 
              config={config} 
              onVote={() => setGameState(GameState.ROUND_VOTE)} 
              onBack={resetToHome}
            />
          )}
          {gameState === GameState.ROUND_VOTE && (
            <VoteScreen 
              key={`vote-${roundNumber}-${gameId}`}
              players={players} 
              onVoteFinished={handleExpulsion} 
              onBack={resetToHome}
            />
          )}
          {gameState === GameState.ROUND_RESULT && (
            <ResultScreen 
              key={`result-${roundNumber}-${gameId}`}
              expelled={lastExpelled} 
              onNextRound={() => {
                setRoundNumber(prev => prev + 1);
                setGameState(GameState.ROUND_CLUES);
              }} 
              onBack={resetToHome}
            />
          )}
          {gameState === GameState.GAME_OVER && (
            <GameOverScreen 
              key={`gameover-${gameId}`}
              players={players} 
              secretWord={secretWord} 
              onHome={() => setGameState(GameState.HOME)} 
              onBack={() => setGameState(GameState.HOME)}
            />
          )}
          {gameState === GameState.LIBRARY && (
             <LibraryScreen onBack={() => setGameState(GameState.HOME)} />
          )}
        </main>

        <footer className="h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-center px-4 shrink-0">
          <span className="text-slate-500 text-[10px] tracking-widest uppercase font-black italic">
            El Impostor • Social Deduction
          </span>
        </footer>
      </div>
    </div>
  );
};

export default App;
