import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { GameService } from '../services/game.service';
import { CardComponent } from './card.component';
import { CardStackComponent } from './card-stack.component';
import { Card, MonsterCard, isMonsterCard } from '../models/card.model';

@Component({
  selector: 'app-game-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, CardStackComponent],
  template: `
    <div class="game-container">
      @if (!gameService.state()) {
        <div class="setup-screen">
          <h1>Monster Cards</h1>
          <button 
            class="btn btn-primary btn-large"
            (click)="startNewGame()"
            type="button">
            Start New Game
          </button>
        </div>
      } @else if (gameService.state(); as state) {
        @if (state.phase === 'setup') {
          <div class="setup-phase">
            <h2>Game Setup</h2>
            <p>Each player: Choose 1 monster for your active spot. 6 prize cards will be randomly selected from your deck.</p>
            
            @for (board of state.boards; track $index; let i = $index) {
              <div class="player-setup">
                <h3>{{ board.playerName }}</h3>
                @if (!setupComplete()[i]) {
                  <div class="hand-cards">
                    @for (card of board.hand; track card.id) {
                      <div 
                        class="hand-card"
                        [class.selected]="selectedActiveCard()[i] === card.id"
                        (click)="selectActiveCard(i, card.id)">
                        <app-card [card]="card" />
                        @if (isMonster(card)) {
                          <div class="card-label">Monster</div>
                        }
                      </div>
                    }
                  </div>
                  @if (selectedActiveCard()[i]) {
                    <button 
                      class="btn btn-primary"
                      (click)="confirmSetup(i)"
                      type="button">
                      Confirm Setup for {{ board.playerName }}
                    </button>
                  }
                } @else {
                  <div class="setup-confirmed">
                    ✓ Setup complete - {{ board.prizeCards.length }} prize cards selected
                  </div>
                }
              </div>
            }
            
            @if (setupComplete()[0] && setupComplete()[1]) {
              <button 
                class="btn btn-success btn-large"
                (click)="beginGame()"
                type="button">
                Begin Game!
              </button>
            }
          </div>
        } @else if (state.phase === 'finished') {
          <div class="game-over">
            <h1>🎉 Game Over! 🎉</h1>
            <h2>{{ state.boards[state.winner!].playerName }} Wins!</h2>
            <button 
              class="btn btn-primary btn-large"
              (click)="startNewGame()"
              type="button">
              Play Again
            </button>
          </div>
        } @else {
          <!-- Playing Phase -->
          <div class="game-board">
            <!-- Player 1 Board (top) -->
            <div class="player-1-board board-container">
              @if (gameService.state(); as state) {
                @if (state.boards[0]; as board) {
                  <div class="board-header">
                    <h3>{{ board.playerName }}</h3>
                    <div class="hp-display">HP: {{ board.hitPoints }}</div>
                  </div>
                  
                  <div class="board-area">
                    <div class="board-section">
                      <label>Deck ({{ board.deck.length }})</label>
                      @if (board.deck.length > 0) {
                        <app-card-stack [cards]="board.deck" [aligned]="true" [faceDown]="true" />
                      }
                    </div>
                    
                    <div class="board-section">
                      <label>Prize Cards ({{ board.prizeCards.length }})</label>
                      @if (board.prizeCards.length > 0) {
                        <app-card-stack [cards]="board.prizeCards" [aligned]="true" [faceDown]="true" />
                      }
                    </div>
                    
                    <div class="board-section">
                      <label>Active</label>
                      @if (board.activeCard) {
                        <div class="active-card-container">
                          <app-card [card]="board.activeCard" />
                          <div class="active-hp">HP: {{ board.activeCard.hitPoints }}</div>
                          @if (board.activeCard.attachedEnergy.length > 0) {
                            <div class="attached-energy">
                              <label>Energy: {{ board.activeCard.attachedEnergy.length }}</label>
                              <div class="energy-icons">
                                @for (energy of board.activeCard.attachedEnergy; track energy.id) {
                                  <div class="energy-badge" [class]="'energy-' + energy.energyType">
                                    {{ energy.energyType[0].toUpperCase() }}
                                  </div>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="empty-slot">No active</div>
                      }
                    </div>
                    
                    <div class="board-section ready-section">
                      <label>Ready ({{ board.readyCards.length }})</label>
                      <div class="ready-cards">
                        @for (card of board.readyCards; track card.id) {
                          <app-card [card]="card" />
                        }
                      </div>
                    </div>
                    
                    <div class="board-section">
                      <label>Discard ({{ board.discardPile.length }})</label>
                      @if (board.discardPile.length > 0) {
                        <app-card-stack [cards]="board.discardPile" [aligned]="false" />
                      }
                    </div>
                  </div>
                }
              }
            </div>

            <!-- Turn Controls -->
            <div class="turn-controls">
              <div class="turn-indicator">
                <strong>{{ currentBoard()?.playerName }}'s Turn</strong>
              </div>
              
              @if (currentBoard(); as board) {
                <div class="action-buttons">
                  @if (board.activeCard && board.activeCard.attacks.length > 0) {
                    @for (attack of board.activeCard.attacks; track $index) {
                      <button 
                        class="btn btn-danger"
                        (click)="performAttack($index)"
                        type="button"
                        [attr.aria-label]="'Attack with ' + attack.name">
                        {{ attack.name }} ({{ attack.damage }} dmg)
                      </button>
                    }
                  }
                  
                  <button 
                    class="btn btn-secondary"
                    (click)="endCurrentTurn()"
                    type="button">
                    End Turn
                  </button>
                </div>
              }
            </div>

            <!-- Player 2 Board (middle) -->
            <div class="player-2-board board-container">
              @if (gameService.state(); as state) {
                @if (state.boards[1]; as board) {
                  <div class="board-area">
                    <div class="board-section">
                      <label>Deck ({{ board.deck.length }})</label>
                      @if (board.deck.length > 0) {
                        <app-card-stack [cards]="board.deck" [aligned]="true" [faceDown]="true" />
                      }
                    </div>
                    
                    <div class="board-section">
                      <label>Prize Cards ({{ board.prizeCards.length }})</label>
                      @if (board.prizeCards.length > 0) {
                        <app-card-stack [cards]="board.prizeCards" [aligned]="true" [faceDown]="true" />
                      }
                    </div>
                    
                    <div class="board-section">
                      <label>Active</label>
                      @if (board.activeCard) {
                        <div class="active-card-container">
                          <app-card [card]="board.activeCard" />
                          <div class="active-hp">HP: {{ board.activeCard.hitPoints }}</div>
                          @if (board.activeCard.attachedEnergy.length > 0) {
                            <div class="attached-energy">
                              <label>Energy: {{ board.activeCard.attachedEnergy.length }}</label>
                              <div class="energy-icons">
                                @for (energy of board.activeCard.attachedEnergy; track energy.id) {
                                  <div class="energy-badge" [class]="'energy-' + energy.energyType">
                                    {{ energy.energyType[0].toUpperCase() }}
                                  </div>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="empty-slot">No active</div>
                      }
                    </div>
                    
                    <div class="board-section ready-section">
                      <label>Ready ({{ board.readyCards.length }})</label>
                      <div class="ready-cards">
                        @for (card of board.readyCards; track card.id) {
                          <app-card [card]="card" />
                        }
                      </div>
                    </div>
                    
                    <div class="board-section">
                      <label>Discard ({{ board.discardPile.length }})</label>
                      @if (board.discardPile.length > 0) {
                        <app-card-stack [cards]="board.discardPile" [aligned]="false" />
                      }
                    </div>
                  </div>
                  
                  <div class="board-header">
                    <h3>{{ board.playerName }}</h3>
                    <div class="hp-display">HP: {{ board.hitPoints }}</div>
                  </div>
                }
              }
            </div>

            <!-- Current Player's Hand (bottom) -->
            <div class="hand-container">
              @if (currentBoard(); as board) {
                <div class="hand-header">
                  <label>{{ board.playerName }}'s Hand ({{ board.hand.length }})</label>
                </div>
                <div class="hand-cards">
                  @for (card of board.hand; track card.id) {
                    <div 
                      class="hand-card"
                      (click)="playCardFromHand(card.id)"
                      [attr.tabindex]="0"
                      [attr.role]="'button'"
                      [attr.aria-label]="'Play ' + card.name"
                      (keydown.enter)="playCardFromHand(card.id)"
                      (keydown.space)="playCardFromHand(card.id)">
                      <app-card [card]="card" />
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .game-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .setup-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      gap: 32px;
    }

    .setup-screen h1 {
      font-size: 72px;
      color: white;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      margin: 0;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn:focus-visible {
      outline: 3px solid #4dabf7;
      outline-offset: 2px;
    }

    .btn-primary {
      background-color: #4dabf7;
      color: white;
    }

    .btn-success {
      background-color: #51cf66;
      color: white;
    }

    .btn-danger {
      background-color: #ff6b6b;
      color: white;
    }

    .btn-secondary {
      background-color: #868e96;
      color: white;
    }

    .btn-large {
      padding: 20px 40px;
      font-size: 24px;
    }

    .setup-phase {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .setup-phase h2 {
      margin: 0 0 16px 0;
      color: #212529;
    }

    .player-setup {
      margin: 32px 0;
      padding: 24px;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .player-setup h3 {
      margin: 0 0 16px 0;
      color: #495057;
    }

    .hand-cards {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin: 16px 0;
    }

    .hand-card {
      position: relative;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .hand-card.playable:hover {
      transform: translateY(-8px);
    }

    .hand-card.selected {
      transform: translateY(-12px);
      filter: drop-shadow(0 8px 16px rgba(74, 144, 226, 0.6));
    }

    .hand-card:focus {
      outline: 3px solid #4dabf7;
      outline-offset: 4px;
      border-radius: 12px;
    }

    .card-label {
      position: absolute;
      bottom: -24px;
      left: 50%;
      transform: translateX(-50%);
      background: #4dabf7;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      white-space: nowrap;
    }

    .setup-confirmed {
      padding: 24px;
      background: #d3f9d8;
      border-radius: 8px;
      color: #2b8a3e;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
    }

    .game-over {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      gap: 32px;
      background: white;
      border-radius: 16px;
      padding: 64px;
      max-width: 800px;
      margin: 0 auto;
    }

    .game-over h1 {
      font-size: 64px;
      color: #212529;
      margin: 0;
    }

    .game-over h2 {
      font-size: 40px;
      color: #51cf66;
      margin: 0;
    }

    .game-board {
      max-width: 1800px;
      margin: 0 auto;
      display: grid;
      grid-template-rows: auto auto auto 1fr;
      gap: 16px;
      height: calc(100vh - 40px);
    }

    .board-container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      padding: 20px;
    }

    .player-1-board {
      grid-row: 1;
    }

    .player-2-board {
      grid-row: 3;
    }

    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .board-header h3 {
      margin: 0;
      color: #212529;
      font-size: 20px;
    }

    .hp-display {
      font-size: 24px;
      font-weight: bold;
      color: #e03131;
      padding: 6px 12px;
      background: #fff5f5;
      border-radius: 8px;
      border: 2px solid #ffc9c9;
    }

    .board-area {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 8px 0;
    }

    .board-section {
      flex-shrink: 0;
      min-width: 200px;
    }

    .ready-section {
      flex-shrink: 0;
      min-width: auto;
    }

    .ready-cards {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .board-section label {
      display: block;
      font-weight: bold;
      color: #495057;
      margin-bottom: 8px;
      font-size: 13px;
    }

    .empty-slot {
      width: 200px;
      height: 280px;
      border: 3px dashed #dee2e6;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #adb5bd;
      font-style: italic;
      font-size: 14px;
    }

    .turn-controls {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      grid-row: 2;
    }

    .turn-indicator {
      font-size: 20px;
      font-weight: bold;
      color: #212529;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .hand-container {
      background: rgba(255, 255, 255, 0.98);
      border-radius: 16px 16px 0 0;
      padding: 20px;
      grid-row: 4;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .hand-header {
      margin-bottom: 12px;
    }

    .hand-header label {
      font-weight: bold;
      color: #212529;
      font-size: 18px;
    }

    .hand-cards {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding: 8px 0;
    }

    .hand-card {
      position: relative;
      cursor: pointer;
      transition: transform 0.2s;
      flex-shrink: 0;
    }

    .hand-card:hover {
      transform: translateY(-12px);
    }

    .hand-card.selected {
      transform: translateY(-16px);
      filter: drop-shadow(0 8px 16px rgba(74, 144, 226, 0.6));
    }

    .hand-card:focus {
      outline: 3px solid #4dabf7;
      outline-offset: 4px;
      border-radius: 12px;
    }

    .active-card-container {
      position: relative;
    }

    .active-hp {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: #fff5f5;
      border: 2px solid #ffc9c9;
      color: #e03131;
      font-weight: bold;
      font-size: 16px;
      padding: 4px 12px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .attached-energy {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid #dee2e6;
      border-radius: 8px;
      padding: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .attached-energy label {
      display: block;
      font-size: 10px;
      font-weight: bold;
      color: #495057;
      margin: 0 0 4px 0;
      text-align: center;
    }

    .energy-icons {
      display: flex;
      gap: 3px;
      flex-wrap: wrap;
      max-width: 80px;
    }

    .energy-badge {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    @media (prefers-reduced-motion: reduce) {
      .btn,
      .hand-card {
        transition: none;
      }
    }
  `]
})
export class GameBoardComponent {
  protected readonly gameService = this.injectGameService();
  
  protected readonly selectedActiveCard = signal<[string | null, string | null]>([null, null]);
  protected readonly setupComplete = signal<[boolean, boolean]>([false, false]);

  protected readonly currentBoard = computed(() => {
    const state = this.gameService.state();
    return state ? state.boards[state.currentPlayer] : null;
  });

  protected readonly opponentBoard = computed(() => {
    const state = this.gameService.state();
    if (!state) return null;
    const opponentIndex = state.currentPlayer === 0 ? 1 : 0;
    return state.boards[opponentIndex];
  });

  protected readonly isMyTurn = computed(() => {
    const state = this.gameService.state();
    return state?.phase === 'playing';
  });

  protected isMonster = isMonsterCard;

  constructor() {
    // Auto-advance to playing if both players have active cards
    effect(() => {
      const state = this.gameService.state();
      if (state?.phase === 'setup') {
        const bothReady = state.boards.every(b => b.activeCard !== null && b.prizeCards.length === 6);
        if (bothReady && !this.setupComplete()[0] && !this.setupComplete()[1]) {
          this.setupComplete.set([true, true]);
        }
      }
    });
  }

  private injectGameService(): GameService {
    return new GameService();
  }

  protected startNewGame(): void {
    this.gameService.createNewGame('Player 1', 'Player 2');
    this.selectedActiveCard.set([null, null]);
    this.setupComplete.set([false, false]);
  }

  protected selectActiveCard(playerIndex: number, cardId: string): void {
    const current = this.selectedActiveCard();
    const newSelection: [string | null, string | null] = [...current] as [string | null, string | null];
    
    const card = this.gameService.getBoard(playerIndex as 0 | 1)?.hand.find(c => c.id === cardId);
    if (card && isMonsterCard(card)) {
      newSelection[playerIndex] = newSelection[playerIndex] === cardId ? null : cardId;
      this.selectedActiveCard.set(newSelection);
    }
  }

  protected confirmSetup(playerIndex: number): void {
    const cardId = this.selectedActiveCard()[playerIndex];
    if (!cardId) return;

    this.gameService.setupPlayerBoard(playerIndex as 0 | 1, cardId);
    
    const completed = this.setupComplete();
    const newCompleted: [boolean, boolean] = [...completed] as [boolean, boolean];
    newCompleted[playerIndex] = true;
    this.setupComplete.set(newCompleted);
  }

  protected beginGame(): void {
    this.gameService.startGame();
  }

  protected playCardFromHand(cardId: string): void {
    if (!this.isMyTurn()) return;
    
    const state = this.gameService.state();
    if (!state) return;

    this.gameService.playCard(state.currentPlayer, cardId);
  }

  protected performAttack(attackIndex: number): void {
    const state = this.gameService.state();
    if (!state) return;

    this.gameService.attack(state.currentPlayer, attackIndex);
  }

  protected endCurrentTurn(): void {
    this.gameService.endTurn();
  }
}
