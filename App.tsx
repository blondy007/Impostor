import React, { useState } from 'react';
import { GameConfig, GameState, Difficulty, Player, Role } from './types';
import { CATEGORIES, INITIAL_WORDS } from './constants';
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

const START_WORD_TIMEOUT_MS = 1500;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [config, setConfig] = useState<GameConfig>({
    playerCount: 7,
    impostorCount: 1,
    difficulty: Difficulty.MEDIUM,
    categories: [...CATEGORIES],
    aiWordGenerationEnabled: false,
    timerEnabled: false,
    timerSeconds: 30,
    winCondition: 'TWO_LEFT',
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
    const filtered = INITIAL_WORDS.filter((w) => w.difficulty === diff);
    const pool = filtered.length > 0 ? filtered : INITIAL_WORDS;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex].text;
  };

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  };

  const startGame = async (newConfig: GameConfig, playerNames: string[]) => {
    try {
      setConfig(newConfig);
      setGameId(Math.random().toString());

      const totalPlayers = playerNames.length;
      const safeImpostorCount = Math.max(1, Math.min(newConfig.impostorCount, totalPlayers - 1));
      const roles: Role[] = new Array(totalPlayers).fill(Role.CIVIL);
      let assignedImpostors = 0;

      while (assignedImpostors < safeImpostorCount) {
        const idx = Math.floor(Math.random() * totalPlayers);
        if (roles[idx] === Role.CIVIL) {
          roles[idx] = Role.IMPOSTOR;
          assignedImpostors++;
        }
      }

      const initialPlayers: Player[] = playerNames.map((name, i) => ({
        id: `p-${i}-${Math.random().toString(36).slice(2, 11)}`,
        name,
        role: roles[i],
        isEliminated: false,
        votesReceived: 0,
      }));

      const revealStartIndex = Math.floor(Math.random() * initialPlayers.length);
      const tableOrderedPlayers = [...initialPlayers.slice(revealStartIndex), ...initialPlayers.slice(0, revealStartIndex)];
      setPlayers(tableOrderedPlayers);
      setLastExpelled(null);

      const localFallbackWord = getRandomLocalWord(newConfig.difficulty);
      let word = '';

      if (newConfig.aiWordGenerationEnabled) {
        try {
          word = await withTimeout(fetchSecretWord(newConfig.difficulty, newConfig.categories), START_WORD_TIMEOUT_MS, '');
        } catch {
          word = '';
        }
      }

      if (!word || word.trim() === '') {
        word = localFallbackWord;
      }

      setSecretWord(word);
      setRoundNumber(1);
      setGameState(GameState.ROLE_REVEAL);
    } catch (criticalError) {
      console.error('Error critico al iniciar:', criticalError);
      setGameState(GameState.HOME);
    }
  };

  const handleExpulsion = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const updatedPlayers = players.map((p) => (p.id === playerId ? { ...p, isEliminated: true } : p));
    setPlayers(updatedPlayers);
    setLastExpelled(player);

    const activeCivilians = updatedPlayers.filter((p) => !p.isEliminated && p.role === Role.CIVIL);
    const activeImpostors = updatedPlayers.filter((p) => !p.isEliminated && p.role === Role.IMPOSTOR);

    if (activeImpostors.length === 0) {
      setGameState(GameState.GAME_OVER);
    } else if (config.winCondition === 'TWO_LEFT' && activeCivilians.length + activeImpostors.length <= 2) {
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
          height: '111.11%',
          maxHeight: '111.11vh',
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
          {gameState === GameState.HOME && <HomeScreen onNewGame={() => setGameState(GameState.SETUP)} onLibrary={() => setGameState(GameState.LIBRARY)} />}
          {gameState === GameState.SETUP && <SetupScreen onBack={() => setGameState(GameState.HOME)} onStart={startGame} />}
          {gameState === GameState.ROLE_REVEAL && (
            <RevealScreen key={`reveal-${gameId}`} players={players} secretWord={secretWord} onFinished={() => setGameState(GameState.ROUND_CLUES)} onBack={resetToHome} />
          )}
          {gameState === GameState.ROUND_CLUES && (
            <RoundScreen
              key={`round-${roundNumber}-${gameId}`}
              players={players.filter((p) => !p.isEliminated)}
              secretWord={secretWord}
              roundNumber={roundNumber}
              onCluesFinished={() => setGameState(GameState.ROUND_DEBATE)}
              onChangeWord={async () => {
                if (!config.aiWordGenerationEnabled) {
                  setSecretWord(getRandomLocalWord(config.difficulty));
                  return;
                }

                try {
                  const w = await withTimeout(fetchSecretWord(config.difficulty, config.categories), START_WORD_TIMEOUT_MS, '');
                  setSecretWord(w || getRandomLocalWord(config.difficulty));
                } catch {
                  setSecretWord(getRandomLocalWord(config.difficulty));
                }
              }}
              onBack={resetToHome}
            />
          )}
          {gameState === GameState.ROUND_DEBATE && (
            <DebateScreen key={`debate-${roundNumber}-${gameId}`} clues={[]} config={config} onVote={() => setGameState(GameState.ROUND_VOTE)} onBack={resetToHome} />
          )}
          {gameState === GameState.ROUND_VOTE && (
            <VoteScreen key={`vote-${roundNumber}-${gameId}`} players={players} onVoteFinished={handleExpulsion} onBack={resetToHome} />
          )}
          {gameState === GameState.ROUND_RESULT && (
            <ResultScreen
              key={`result-${roundNumber}-${gameId}`}
              expelled={lastExpelled}
              onNextRound={() => {
                setRoundNumber((prev) => prev + 1);
                setGameState(GameState.ROUND_CLUES);
              }}
              onBack={resetToHome}
            />
          )}
          {gameState === GameState.GAME_OVER && (
            <GameOverScreen key={`gameover-${gameId}`} players={players} secretWord={secretWord} onHome={() => setGameState(GameState.HOME)} onBack={() => setGameState(GameState.HOME)} />
          )}
          {gameState === GameState.LIBRARY && <LibraryScreen onBack={() => setGameState(GameState.HOME)} />}
        </main>

        <footer className="h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-center px-4 shrink-0">
          <span className="text-slate-500 text-[10px] tracking-widest uppercase font-black italic">El Impostor - Social Deduction</span>
        </footer>
      </div>
    </div>
  );
};

export default App;
