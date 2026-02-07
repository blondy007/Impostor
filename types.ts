
export enum Role {
  CIVIL = 'CIVIL',
  IMPOSTOR = 'IMPOSTOR'
}

export enum Difficulty {
  EASY = 'Fácil',
  MEDIUM = 'Media',
  HARD = 'Difícil',
  EXTREME = 'Extrema'
}

export enum GameState {
  HOME = 'HOME',
  SETUP = 'SETUP',
  ROLE_REVEAL = 'ROLE_REVEAL',
  ROUND_CLUES = 'ROUND_CLUES',
  ROUND_DEBATE = 'ROUND_DEBATE',
  ROUND_VOTE = 'ROUND_VOTE',
  ROUND_RESULT = 'ROUND_RESULT',
  GAME_OVER = 'GAME_OVER',
  LIBRARY = 'LIBRARY'
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  isEliminated: boolean;
  eliminationRound?: number;
  clue?: string;
  votesReceived: number;
}

export interface VoteResolution {
  expelledId: string;
  mode: 'INDIVIDUAL' | 'GROUP';
  votesByVoter: Record<string, string>;
}

export interface ScoreRoundLog {
  sessionRound: number;
  gameRound: number;
  expelledName: string;
  expelledRole: Role;
  deltas: Record<string, number>;
  notes: Record<string, string[]>;
}

export interface GameConfig {
  playerCount: number;
  impostorCount: number;
  difficulty: Difficulty;
  categories: string[];
  voteMode: 'INDIVIDUAL' | 'GROUP';
  aiWordGenerationEnabled: boolean;
  timerEnabled: boolean;
  timerSeconds: number;
  winCondition: 'TWO_LEFT' | 'PARITY';
}

export interface Word {
  id: string;
  text: string;
  category: string;
  difficulty: Difficulty;
}

export interface GameSession {
  id: string;
  state: GameState;
  config: GameConfig;
  players: Player[];
  secretWord: string;
  currentTurnIndex: number;
  roundNumber: number;
  clues: string[];
  history: any[];
}
