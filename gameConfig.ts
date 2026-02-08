import { CATEGORIES } from './constants';
import { Difficulty, GameConfig } from './types';

const MIN_PLAYERS = 3;
const MAX_IMPOSTORS = 3;
const MIN_TIMER_SECONDS = 15;
const MAX_TIMER_SECONDS = 180;

const DIFFICULTIES = new Set<Difficulty>(Object.values(Difficulty));

const sanitizeCategories = (categories: string[] | undefined): string[] => {
  if (!Array.isArray(categories)) return [...CATEGORIES];
  const cleaned = categories.map((category) => category.trim()).filter((category) => category.length > 0);
  const unique = Array.from(new Set(cleaned));
  return unique.length > 0 ? unique : [...CATEGORIES];
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  playerCount: 7,
  impostorCount: 1,
  difficulty: Difficulty.MEDIUM,
  categories: [...CATEGORIES],
  voteMode: 'GROUP',
  aiWordGenerationEnabled: false,
  clueCaptureEnabled: false,
  timerEnabled: true,
  timerSeconds: 60,
  winCondition: 'TWO_LEFT',
};

export const normalizeGameConfig = (config?: Partial<GameConfig>): GameConfig => {
  const source = config ?? {};

  const playerCountRaw = Number.isFinite(source.playerCount) ? Math.floor(source.playerCount as number) : DEFAULT_GAME_CONFIG.playerCount;
  const playerCount = Math.max(MIN_PLAYERS, playerCountRaw);

  const maxImpostorsByPlayerCount = Math.max(1, Math.min(MAX_IMPOSTORS, playerCount - 1));
  const impostorCountRaw = Number.isFinite(source.impostorCount) ? Math.floor(source.impostorCount as number) : DEFAULT_GAME_CONFIG.impostorCount;
  const impostorCount = Math.max(1, Math.min(maxImpostorsByPlayerCount, impostorCountRaw));

  const timerSecondsRaw = Number.isFinite(source.timerSeconds) ? Math.floor(source.timerSeconds as number) : DEFAULT_GAME_CONFIG.timerSeconds;
  const timerSeconds = Math.max(MIN_TIMER_SECONDS, Math.min(MAX_TIMER_SECONDS, timerSecondsRaw));

  return {
    playerCount,
    impostorCount,
    difficulty: DIFFICULTIES.has(source.difficulty as Difficulty) ? (source.difficulty as Difficulty) : DEFAULT_GAME_CONFIG.difficulty,
    categories: sanitizeCategories(source.categories),
    voteMode: source.voteMode === 'INDIVIDUAL' || source.voteMode === 'GROUP' ? source.voteMode : DEFAULT_GAME_CONFIG.voteMode,
    aiWordGenerationEnabled: source.aiWordGenerationEnabled ?? DEFAULT_GAME_CONFIG.aiWordGenerationEnabled,
    clueCaptureEnabled: source.clueCaptureEnabled ?? DEFAULT_GAME_CONFIG.clueCaptureEnabled,
    timerEnabled: source.timerEnabled ?? DEFAULT_GAME_CONFIG.timerEnabled,
    timerSeconds,
    winCondition: source.winCondition === 'PARITY' || source.winCondition === 'TWO_LEFT' ? source.winCondition : DEFAULT_GAME_CONFIG.winCondition,
  };
};
