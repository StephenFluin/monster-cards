import { GameBoard } from './game.model';

export type CardType = 'fire' | 'water' | 'grass' | 'special';
export type EnergyType = 'fire' | 'water' | 'grass';

export interface Ability {
  text: string;
  execute: (gameBoards: GameBoard[]) => void;
}

export interface Attack {
  name: string;
  energyRequirement: { type: EnergyType; amount: number }[];
  damage: number;
}

export interface BaseCard {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface MonsterCard extends BaseCard {
  cardCategory: 'monster';
  type: Exclude<CardType, 'special'>;
  hitPoints: number;
  attacks: Attack[];
  attachedEnergy: EnergyCard[];
}

export interface SpecialCard extends BaseCard {
  cardCategory: 'special';
  type: 'special';
  ability: Ability;
}

export interface EnergyCard extends BaseCard {
  cardCategory: 'energy';
  energyType: EnergyType;
}

export type Card = MonsterCard | SpecialCard | EnergyCard;

export function isMonsterCard(card: Card): card is MonsterCard {
  return card.cardCategory === 'monster';
}

export function isSpecialCard(card: Card): card is SpecialCard {
  return card.cardCategory === 'special';
}

export function isEnergyCard(card: Card): card is EnergyCard {
  return card.cardCategory === 'energy';
}
