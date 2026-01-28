import { Card, MonsterCard } from './card.model';

export interface GameBoard {
  playerName: string;
  hitPoints: number;
  hand: Card[];
  prizeCards: Card[];
  activeCard: MonsterCard | null;
  readyCards: MonsterCard[];
  deck: Card[];
  discardPile: Card[];
}

export interface GameState {
  boards: [GameBoard, GameBoard];
  currentPlayer: 0 | 1;
  phase: 'setup' | 'playing' | 'finished';
  winner?: 0 | 1;
}
