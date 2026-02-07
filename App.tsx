import React, { useEffect, useRef, useState } from 'react';
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
const THEME_STORAGE_KEY = 'impostor_theme_mode_v1';

type UsedWordsByDifficulty = Record<Difficulty, Set<string>>;
type WordFlowModalAction = 'primary' | 'secondary';
type ThemeMode = 'default' | 'light' | 'wild';

interface WordFlowModalState {
  title: string;
  message: string;
  primaryLabel: string;
  secondaryLabel?: string;
}

const THEME_OPTIONS: { id: ThemeMode; label: string; subtitle: string }[] = [
  { id: 'default', label: 'Actual', subtitle: 'Noir clasico' },
  { id: 'light', label: 'Claro', subtitle: 'Mas luminoso' },
  { id: 'wild', label: 'Loco', subtitle: 'Neon extremo' },
];

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

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'default';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'default' || stored === 'light' || stored === 'wild') return stored;
  return 'default';
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
  const [ivanCheatUsedForCurrentWord, setIvanCheatUsedForCurrentWord] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [lastExpelled, setLastExpelled] = useState<Player | null>(null);
  const [gameId, setGameId] = useState(Math.random().toString());
  const [wordFlowModal, setWordFlowModal] = useState<WordFlowModalState | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode());
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const usedWordsRef = useRef<UsedWordsByDifficulty>(loadUsedWordsFromSession());
  const wordFlowModalResolverRef = useRef<((action: WordFlowModalAction) => void) | null>(null);
  const currentTheme = THEME_OPTIONS.find((theme) => theme.id === themeMode) || THEME_OPTIONS[0];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const resetToHome = () => {
    setGameState(GameState.HOME);
  };

  const resolveWordFlowModal = (action: WordFlowModalAction) => {
    const resolver = wordFlowModalResolverRef.current;
    wordFlowModalResolverRef.current = null;
    setWordFlowModal(null);
    if (resolver) resolver(action);
  };

  const showWordFlowDecisionModal = async (modalState: WordFlowModalState): Promise<WordFlowModalAction> => {
    return await new Promise<WordFlowModalAction>((resolve) => {
      wordFlowModalResolverRef.current = resolve;
      setWordFlowModal(modalState);
    });
  };

  const showWordFlowInfoModal = async (title: string, message: string, buttonLabel = 'Entendido'): Promise<void> => {
    await showWordFlowDecisionModal({
      title,
      message,
      primaryLabel: buttonLabel,
    });
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

  const askUserWhenLocalWordsExhausted = async (activeConfig: GameConfig): Promise<GameConfig | null> => {
    const decision = await showWordFlowDecisionModal({
      title: 'Sin palabras locales',
      message:
        `No quedan palabras locales para "${activeConfig.difficulty}" en esta sesion.\n\n` +
        `Puedes cambiar la dificultad o activar busqueda por IA.`,
      primaryLabel: 'Activar IA',
      secondaryLabel: 'Cambiar dificultad',
    });

    if (decision !== 'primary') {
      await showWordFlowInfoModal('Cambio requerido', 'Mantienes IA desactivada. Cambia la dificultad para continuar.');
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

      const updatedConfig = await askUserWhenLocalWordsExhausted(baseConfig);
      if (!updatedConfig) {
        throw new Error(WORD_SELECTION_CANCELLED);
      }

      const aiWord = await tryFetchAiWord(updatedConfig);
      if (aiWord && aiWord.trim() !== '') {
        return { word: aiWord.trim(), effectiveConfig: updatedConfig };
      }

      await showWordFlowInfoModal('IA sin respuesta', 'No se pudo obtener palabra por IA. Cambia dificultad o reintenta.');
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

    await showWordFlowInfoModal(
      'Sin palabras disponibles',
      `No quedan palabras locales para "${baseConfig.difficulty}" y la IA no respondio a tiempo.\nCambia dificultad o reintenta la IA.`
    );
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
      setIvanCheatUsedForCurrentWord(false);
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

  const impostorNames = players.filter((p) => p.role === Role.IMPOSTOR).map((p) => p.name);

  return (
    <div className={`app-shell theme-${themeMode} min-h-screen w-full flex flex-col items-center overflow-hidden`}>
      <div
        className="app-viewport max-w-md w-full min-h-screen flex flex-col relative bg-slate-950 text-slate-100 shadow-2xl"
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
            <RevealScreen
              key={`reveal-${gameId}`}
              players={players}
              secretWord={secretWord}
              impostorNames={impostorNames}
              ivanCheatAvailable={!ivanCheatUsedForCurrentWord}
              onIvanCheatUsed={() => setIvanCheatUsedForCurrentWord(true)}
              onFinished={() => setGameState(GameState.ROUND_CLUES)}
              onBack={resetToHome}
            />
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
                  setIvanCheatUsedForCurrentWord(false);
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

        {wordFlowModal && (
          <div className="absolute inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-[2rem] p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="text-center space-y-3">
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-indigo-400">Gestion de palabras</p>
                <h3 className="text-2xl font-black italic tracking-tight text-white">{wordFlowModal.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{wordFlowModal.message}</p>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => resolveWordFlowModal('primary')}
                  className="w-full bg-white text-slate-950 p-4 rounded-[1.4rem] font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
                >
                  {wordFlowModal.primaryLabel}
                </button>

                {wordFlowModal.secondaryLabel && (
                  <button
                    onClick={() => resolveWordFlowModal('secondary')}
                    className="w-full bg-slate-800 text-slate-200 p-4 rounded-[1.4rem] font-black text-sm uppercase tracking-widest border border-slate-700 active:scale-95 transition-all"
                  >
                    {wordFlowModal.secondaryLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-16 left-4 z-[130]">
          {isThemeMenuOpen && (
            <div className="mb-3 bg-slate-900/95 border border-slate-700 rounded-2xl p-2 w-44 shadow-2xl backdrop-blur">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setThemeMode(theme.id);
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                    themeMode === theme.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <p className="text-[11px] font-black uppercase tracking-wide">{theme.label}</p>
                  <p className="text-[9px] font-bold opacity-80 uppercase tracking-wide">{theme.subtitle}</p>
                </button>
              ))}
            </div>
          )}

          <button onClick={() => setIsThemeMenuOpen((prev) => !prev)} className="bg-slate-900/95 border border-slate-700 rounded-2xl px-4 py-2 text-left shadow-xl backdrop-blur">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Tema</p>
            <p className="text-[11px] text-white font-black uppercase tracking-wide">{currentTheme.label}</p>
          </button>
        </div>

        <footer className="h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-center px-4 shrink-0">
          <span className="text-slate-500 text-[10px] tracking-widest uppercase font-black italic">El Impostor - Social Deduction</span>
        </footer>
      </div>
    </div>
  );
};

export default App;
