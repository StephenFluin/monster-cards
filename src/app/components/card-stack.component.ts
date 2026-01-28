import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { Card } from '../models/card.model';
import { CardComponent } from './card.component';

@Component({
  selector: 'app-card-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent],
  template: `
    <div 
      class="card-stack" 
      [class.aligned]="aligned()"
      [class.unaligned]="!aligned()"
      role="group"
      [attr.aria-label]="'Stack of ' + cards().length + ' cards'">
      @for (card of visibleCards(); track card.id; let i = $index) {
        <div 
          class="card-wrapper"
          [style.transform]="getCardTransform(i)"
          [style.z-index]="i"
          (mouseenter)="onCardHover(i)"
          (mouseleave)="onCardLeave()"
          [attr.tabindex]="0"
          [attr.role]="'button'"
          [attr.aria-label]="faceDown() ? 'Card ' + (i + 1) + ' of ' + cards().length : card.name">
          <app-card [card]="card" [faceDown]="faceDown()" />
        </div>
      }

      @if (hoveredCardIndex() !== null && hoveredCard(); as card) {
        <div 
          class="card-preview"
          role="dialog"
          aria-label="Card preview">
          <app-card [card]="card" [faceDown]="faceDown()" />
        </div>
      }
    </div>
  `,
  styles: [`
    .card-stack {
      position: relative;
      display: inline-block;
      min-width: 200px;
      min-height: 280px;
    }

    .card-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      transition: transform 0.2s ease;
      cursor: pointer;
    }

    .card-wrapper:focus {
      outline: 2px solid #4dabf7;
      outline-offset: 4px;
      border-radius: 12px;
    }

    .card-wrapper:focus-visible {
      outline: 2px solid #4dabf7;
      outline-offset: 4px;
    }

    .aligned .card-wrapper {
      /* 2px offset for aligned stacks */
    }

    .unaligned .card-wrapper {
      /* Top 10% visible for unaligned stacks */
    }

    .card-preview {
      position: absolute;
      left: calc(100% + 20px);
      top: 0;
      z-index: 1000;
      pointer-events: none;
      animation: fadeIn 0.2s ease;
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .card-wrapper,
      .card-preview {
        transition: none;
        animation: none;
      }
    }
  `]
})
export class CardStackComponent {
  cards = input.required<Card[]>();
  aligned = input<boolean>(false);
  faceDown = input<boolean>(false);

  readonly hoveredCardIndex = signal<number | null>(null);
  readonly hoveredCard = signal<Card | null>(null);

  readonly visibleCards = (): Card[] => {
    const allCards = this.cards();
    // Show all cards in aligned mode, or up to 10 cards in unaligned mode
    return this.aligned() ? allCards : allCards.slice(-10);
  };

  getCardTransform(index: number): string {
    if (this.aligned()) {
      // For aligned stacks: 2px offset on x and y
      const offset = index * 2;
      return `translate(${offset}px, ${offset}px)`;
    } else {
      // For unaligned stacks: show top 10% of each card (28px for a 280px tall card)
      const offset = index * 28;
      return `translateY(${offset}px)`;
    }
  }

  onCardHover(index: number): void {
    if (!this.faceDown()) {
      this.hoveredCardIndex.set(index);
      const visibleCards = this.visibleCards();
      this.hoveredCard.set(visibleCards[index]);
    }
  }

  onCardLeave(): void {
    this.hoveredCardIndex.set(null);
    this.hoveredCard.set(null);
  }
}
