import { Injectable, signal } from '@angular/core';
import { GameState, GameBoard } from '../models/game.model';
import { Card, MonsterCard, SpecialCard, EnergyCard, CardType, EnergyType, Attack, isMonsterCard, isSpecialCard, isEnergyCard } from '../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly gameState = signal<GameState | null>(null);

  readonly state = this.gameState.asReadonly();

  createNewGame(player1Name: string = 'Player 1', player2Name: string = 'Player 2'): void {
    const deck1 = this.generateDeck();
    const deck2 = this.generateDeck();

    const board1: GameBoard = {
      playerName: player1Name,
      hitPoints: 100,
      hand: [],
      prizeCards: [],
      activeCard: null,
      readyCards: [],
      deck: this.shuffleDeck(deck1),
      discardPile: []
    };

    const board2: GameBoard = {
      playerName: player2Name,
      hitPoints: 100,
      hand: [],
      prizeCards: [],
      activeCard: null,
      readyCards: [],
      deck: this.shuffleDeck(deck2),
      discardPile: []
    };

    this.gameState.set({
      boards: [board1, board2],
      currentPlayer: 0,
      phase: 'setup'
    });

    // Deal initial 7 cards to each player
    this.dealInitialHands();
  }

  private generateDeck(): Card[] {
    const deck: Card[] = [];
    const monsterTypes: Array<'fire' | 'water' | 'grass'> = ['fire', 'water', 'grass'];
    
    // Generate ~40 monster cards
    for (let i = 0; i < 40; i++) {
      const type = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      const numAttacks = Math.floor(Math.random() * 3); // 0, 1, or 2 attacks
      const attacks: Attack[] = [];
      
      for (let j = 0; j < numAttacks; j++) {
        attacks.push({
          name: `Attack ${j + 1}`,
          energyRequirement: [{ type, amount: Math.floor(Math.random() * 3) + 1 }],
          damage: (Math.floor(Math.random() * 5) + 1) * 10
        });
      }

      const monster: MonsterCard = {
        id: `monster-${i}-${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Monster ${i + 1}`,
        cardCategory: 'monster',
        type,
        hitPoints: (Math.floor(Math.random() * 8) + 3) * 10,
        attacks,
        attachedEnergy: []
      };
      deck.push(monster);
    }

    // Generate ~15 energy cards (5 of each type)
    for (let i = 0; i < 15; i++) {
      const energyType = monsterTypes[i % 3];
      const energy: EnergyCard = {
        id: `energy-${i}-${Date.now()}`,
        name: `${energyType.charAt(0).toUpperCase() + energyType.slice(1)} Energy`,
        cardCategory: 'energy',
        energyType
      };
      deck.push(energy);
    }

    // Generate ~5 special cards
    for (let i = 0; i < 5; i++) {
      const special: SpecialCard = {
        id: `special-${i}-${Date.now()}`,
        name: `Special Card ${i + 1}`,
        cardCategory: 'special',
        type: 'special',
        ability: {
          text: 'This is a special ability that affects the game.',
          execute: (gameBoards) => {
            console.log('Special ability executed', gameBoards);
          }
        }
      };
      deck.push(special);
    }

    return deck;
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private dealInitialHands(): void {
    const state = this.gameState();
    if (!state) return;

    const newBoards: [GameBoard, GameBoard] = [...state.boards] as [GameBoard, GameBoard];

    for (let i = 0; i < 2; i++) {
      const board = newBoards[i];
      const hand: Card[] = [];
      
      // Draw 7 cards
      for (let j = 0; j < 7; j++) {
        const card = board.deck.pop();
        if (card) hand.push(card);
      }

      newBoards[i] = { ...board, hand };
    }

    this.gameState.set({ ...state, boards: newBoards });
  }

  setupPlayerBoard(playerIndex: 0 | 1, activeCardId: string): void {
    const state = this.gameState();
    if (!state || state.phase !== 'setup') return;

    const board = state.boards[playerIndex];
    const activeCard = board.hand.find(c => c.id === activeCardId && isMonsterCard(c)) as MonsterCard | undefined;
    
    if (!activeCard) return;

    // Remove active card from hand
    const newHand = board.hand.filter(c => c.id !== activeCardId);

    // Randomly select 6 prize cards from deck
    const prizeCards: Card[] = [];
    for (let i = 0; i < 6; i++) {
      const card = board.deck.pop();
      if (card) prizeCards.push(card);
    }

    const newBoards = [...state.boards] as [GameBoard, GameBoard];
    newBoards[playerIndex] = {
      ...board,
      hand: newHand,
      activeCard,
      prizeCards
    };

    this.gameState.set({ ...state, boards: newBoards });
  }

  startGame(): void {
    const state = this.gameState();
    if (!state || state.phase !== 'setup') return;

    this.gameState.set({ ...state, phase: 'playing' });
  }

  drawCard(playerIndex: 0 | 1): void {
    const state = this.gameState();
    if (!state || state.phase !== 'playing' || state.currentPlayer !== playerIndex) return;

    const board = state.boards[playerIndex];
    const card = board.deck.pop();
    
    if (!card) return;

    const newBoards = [...state.boards] as [GameBoard, GameBoard];
    newBoards[playerIndex] = {
      ...board,
      hand: [...board.hand, card]
    };

    this.gameState.set({ ...state, boards: newBoards });
  }

  playCard(playerIndex: 0 | 1, cardId: string): void {
    const state = this.gameState();
    if (!state || state.phase !== 'playing' || state.currentPlayer !== playerIndex) return;

    const board = state.boards[playerIndex];
    const card = board.hand.find(c => c.id === cardId);
    
    if (!card) return;

    const newHand = board.hand.filter(c => c.id !== cardId);
    let newBoard = { ...board, hand: newHand };

    if (isMonsterCard(card)) {
      // Monster goes to ready cards
      newBoard = { ...newBoard, readyCards: [...board.readyCards, card] };
    } else if (isSpecialCard(card)) {
      // Activate special ability
      card.ability.execute(state.boards);
      newBoard = { ...newBoard, discardPile: [...board.discardPile, card] };
    } else if (isEnergyCard(card)) {
      // Attach energy to active monster
      if (board.activeCard) {
        const updatedActiveCard: MonsterCard = {
          ...board.activeCard,
          attachedEnergy: [...board.activeCard.attachedEnergy, card]
        };
        newBoard = { ...newBoard, activeCard: updatedActiveCard };
      } else {
        // No active monster, discard the energy
        newBoard = { ...newBoard, discardPile: [...board.discardPile, card] };
      }
    }

    const newBoards = [...state.boards] as [GameBoard, GameBoard];
    newBoards[playerIndex] = newBoard;

    this.gameState.set({ ...state, boards: newBoards });
  }

  attack(playerIndex: 0 | 1, attackIndex: number): void {
    const state = this.gameState();
    if (!state || state.phase !== 'playing' || state.currentPlayer !== playerIndex) return;

    const attackingBoard = state.boards[playerIndex];
    const defendingPlayerIndex = playerIndex === 0 ? 1 : 0;
    const defendingBoard = state.boards[defendingPlayerIndex];
    
    if (!attackingBoard.activeCard || attackIndex >= attackingBoard.activeCard.attacks.length) {
      return;
    }

    if (!defendingBoard.activeCard) {
      return; // Can't attack if opponent has no active monster
    }

    const attack = attackingBoard.activeCard.attacks[attackIndex];
    const newHitPoints = Math.max(0, defendingBoard.activeCard.hitPoints - attack.damage);
    
    const newBoards = [...state.boards] as [GameBoard, GameBoard];
    let newDefendingBoard = { ...defendingBoard };
    let newAttackingBoard = { ...attackingBoard };

    // Update defending monster's HP
    newDefendingBoard.activeCard = {
      ...defendingBoard.activeCard,
      hitPoints: newHitPoints
    };

    // Check if defending monster was defeated
    if (newHitPoints <= 0) {
      // Move defeated monster and its attached energy cards to discard pile
      const cardsToDiscard: Card[] = [defendingBoard.activeCard, ...defendingBoard.activeCard.attachedEnergy];
      newDefendingBoard.discardPile = [...defendingBoard.discardPile, ...cardsToDiscard];
      newDefendingBoard.activeCard = null;

      // Attacker takes a prize card
      if (newAttackingBoard.prizeCards.length > 0) {
        const prizeCard = newAttackingBoard.prizeCards.pop()!;
        newAttackingBoard.hand = [...attackingBoard.hand, prizeCard];

        // Check for win condition
        if (newAttackingBoard.prizeCards.length === 0) {
          newBoards[playerIndex] = newAttackingBoard;
          newBoards[defendingPlayerIndex] = newDefendingBoard;
          this.gameState.set({ 
            ...state, 
            boards: newBoards, 
            phase: 'finished',
            winner: playerIndex
          });
          return;
        }
      }
    }

    newBoards[playerIndex] = newAttackingBoard;
    newBoards[defendingPlayerIndex] = newDefendingBoard;

    this.gameState.set({ ...state, boards: newBoards });
  }

  endTurn(): void {
    const state = this.gameState();
    if (!state || state.phase !== 'playing') return;

    this.gameState.set({
      ...state,
      currentPlayer: state.currentPlayer === 0 ? 1 : 0
    });

    // Auto-draw for next player
    this.drawCard(state.currentPlayer === 0 ? 1 : 0);
  }

  getBoard(playerIndex: 0 | 1): GameBoard | null {
    const state = this.gameState();
    return state ? state.boards[playerIndex] : null;
  }
}
