import React, { useRef, useState } from 'react';
import { CATEGORIES, INITIAL_WORDS } from './constants';
import { fetchSecretWord } from './services/geminiService';
import { Difficulty, GameConfig, GameState, Player, Role, Word } from './types';
import DebateScreen from './screens/DebateScreen';
import GameOverScreen from './screens/GameOverScreen';
import HomeScreen from './screens/HomeScreen';
import LibraryScreen from './screens/LibraryScreen';
import ResultScreen from './screens/ResultScreen';
import RevealScreen from './screens/RevealScreen';
import RoundScreen from './screens/RoundScreen';
import SetupScreen from './screens/SetupScreen';
import VoteScreen from './screens/VoteScreen';

const START_WORD_TIMEOUT_MS = 5000;
const USED_WORDS_SESSION_KEY = 'impostor_used_local_words_v1';
const WORD_SELECTION_CANCELLED = 'WORD_SELECTION_CANCELLED';

type UsedWordsByDifficulty = Record<Difficulty, Set<string>>;

const createEmptyUsedWords = (): UsedWordsByDifficulty => ({
  [Difficulty.EASY]: new Set<string>(),
  [Difficulty.MEDIUM]: new Set<string>(),
  [Difficulty.HARD]: new Set<string>(),
  [Difficulty.EXTREME]: new Set<string>(),
});

const loadUsedWordsFromSession = (): UsedWordsByDifficulty => {
  if (typeof window === 'undefined') return createEmptyUsedWords();

  try {
    const raw = window.sessionStorage.getItem(USED_WORDS_SESSION_KEY);
    if (!raw) return createEmptyUsedWords();

    const parsed = JSON.parse(raw) as Partial<Record<Difficulty, string[]>>;
    return {
      [Difficulty.EASY]: new Set(parsed[Difficulty.EASY] || []),
      [Difficulty.MEDIUM]: new Set(parsed[Difficulty.MEDIUM] || []),
      [Difficulty.HARD]: new Set(parsed[Difficulty.HARD] || []),
      [Difficulty.EXTREME]: new Set(parsed[Difficulty.EXTREME] || []),
    };
  } catch {
    return createEmptyUsedWords();
  }
};

const persistUsedWordsInSession = (usedWords: UsedWordsByDifficulty) => {
  if (typeof window === 'undefined') return;
  const serializable: Record<Difficulty, string[]> = {
    [Difficulty.EASY]: Array.from(usedWords[Difficulty.EASY]),
    [Difficulty.MEDIUM]: Array.from(usedWords[Difficulty.MEDIUM]),
    [Difficulty.HARD]: Array.from(usedWords[Difficulty.HARD]),
    [Difficulty.EXTREME]: Array.from(usedWords[Difficulty.EXTREME]),
  };
  window.sessionStorage.setItem(USED_WORDS_SESSION_KEY, JSON.stringify(serializable));
};

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
  const usedWordsRef = useRef<UsedWordsByDifficulty>(loadUsedWordsFromSession());

  const resetToHome = () => {
    setGameState(GameState.HOME);
  };

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  };

  const getUnusedLocalWord = (difficulty: Difficulty): Word | null => {
    const usedIds = usedWordsRef.current[difficulty];
    const candidates = INITIAL_WORDS.filter((word) => word.difficulty === difficulty && !usedIds.has(word.id));
    if (candidates.length === 0) return null;

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    usedIds.add(selected.id);
    persistUsedWordsInSession(usedWordsRef.current);
    return selected;
  };

  const tryFetchAiWord = async (activeConfig: GameConfig): Promise<string> => {
    try {
      return await withTimeout(fetchSecretWord(activeConfig.difficulty, activeConfig.categories), START_WORD_TIMEOUT_MS, '');
    } catch {
      return '';
    }
  };

  const askUserWhenLocalWordsExhausted = (activeConfig: GameConfig): GameConfig | null => {
    const shouldEnableAI = window.confirm(
      `No quedan palabras locales en dificultad "${activeConfig.difficulty}" para esta sesion.\n\n` +
        `Opciones:\n` +
        `- Cambiar dificultad\n` +
        `- Activar busqueda por IA\n\n` +
        `¿Quieres activar "Palabra por IA" ahora?`
    );

    if (!shouldEnableAI) {
      window.alert('Mantienes IA desactivada. Cambia la dificultad en configuracion para continuar.');
      return null;
    }

    const updatedConfig: GameConfig = {
      ...activeConfig,
      aiWordGenerationEnabled: true,
    };
    setConfig(updatedConfig);
    return updatedConfig;
  };

  const resolveSecretWord = async (baseConfig: GameConfig): Promise<{ word: string; effectiveConfig: GameConfig }> => {
    if (!baseConfig.aiWordGenerationEnabled) {
      const localWord = getUnusedLocalWord(baseConfig.difficulty);
      if (localWord) {
        return { word: localWord.text, effectiveConfig: baseConfig };
      }

      const updatedConfig = askUserWhenLocalWordsExhausted(baseConfig);
      if (!updatedConfig) {
        throw new Error(WORD_SELECTION_CANCELLED);
      }

      const aiWord = await tryFetchAiWord(updatedConfig);
      if (aiWord && aiWord.trim() !== '') {
        return { word: aiWord.trim(), effectiveConfig: updatedConfig };
      }

      window.alert('No se pudo obtener palabra por IA. Cambia dificultad o reintenta.');
      throw new Error(WORD_SELECTION_CANCELLED);
    }

    const aiWord = await tryFetchAiWord(baseConfig);
    if (aiWord && aiWord.trim() !== '') {
      return { word: aiWord.trim(), effectiveConfig: baseConfig };
    }

    const fallbackLocalWord = getUnusedLocalWord(baseConfig.difficulty);
    if (fallbackLocalWord) {
      return { word: fallbackLocalWord.text, effectiveConfig: baseConfig };
    }

    window.alert(`No quedan palabras locales para "${baseConfig.difficulty}" y la IA no respondio a tiempo.\nCambia dificultad o reintenta la IA.`);
    throw new Error(WORD_SELECTION_CANCELLED);
  };

  const startGame = async (newConfig: GameConfig, playerNames: string[]) => {
    try {
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

      const { word, effectiveConfig } = await resolveSecretWord(newConfig);

      setConfig(effectiveConfig);
      setGameId(Math.random().toString());
      setPlayers(tableOrderedPlayers);
      setLastExpelled(null);
      setSecretWord(word);
      setRoundNumber(1);
      setGameState(GameState.ROLE_REVEAL);
    } catch (error: any) {
      if (error?.message === WORD_SELECTION_CANCELLED) {
        throw error;
      }
      console.error('Error critico al iniciar:', error);
      setGameState(GameState.HOME);
      throw error;
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
          {gameState === GameState.SETUP && <SetupScreen onBack={() => setGameState(GameState.HOME)} onStart={startGame} initialConfig={config} />}
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
                try {
                  const { word, effectiveConfig } = await resolveSecretWord(config);
                  setConfig(effectiveConfig);
                  setSecretWord(word);
                } catch (error: any) {
                  if (error?.message !== WORD_SELECTION_CANCELLED) {
                    console.error('No se pudo cambiar palabra:', error);
                  }
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
            <GameOverScreen
              key={`gameover-${gameId}`}
              players={players}
              secretWord={secretWord}
              onHome={() => setGameState(GameState.SETUP)}
              onBack={() => setGameState(GameState.HOME)}
            />
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
