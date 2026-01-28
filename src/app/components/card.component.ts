import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { Card, isMonsterCard, isSpecialCard, isEnergyCard } from '../models/card.model';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="card" 
      [class.face-down]="faceDown()"
      [attr.role]="'img'"
      [attr.aria-label]="faceDown() ? 'Face down card' : card()?.name">
      @if (faceDown()) {
        <div class="card-back">
          <div class="card-back-pattern"></div>
        </div>
      } @else if (card(); as cardData) {
        @if (isEnergy(cardData)) {
          <div class="card-front energy-card" [class]="'energy-' + cardData.energyType">
            <div class="energy-symbol">⚡</div>
            <div class="energy-name">{{ cardData.name }}</div>
          </div>
        } @else {
          <div class="card-front">
            <div class="card-header">
              <div class="card-name">{{ cardData.name }}</div>
              <div class="card-stats">
                <span class="card-type" [class]="'type-' + cardData.type">
                  {{ cardData.type }}
                </span>
                @if (isMonster(cardData)) {
                  <span class="card-hp">HP: {{ cardData.hitPoints }}</span>
                }
              </div>
            </div>
            
            <div class="card-image-container">
              @if (cardData.imageUrl) {
                <img [src]="cardData.imageUrl" [alt]="cardData.name" class="card-image" />
              } @else {
                <div class="card-image-placeholder"></div>
              }
            </div>

            @if (isMonster(cardData) && cardData.attacks.length > 0) {
              <div class="card-attacks">
                @for (attack of cardData.attacks; track $index) {
                  <div class="attack">
                    <div class="attack-cost">
                      @for (req of attack.energyRequirement; track $index) {
                        <span class="energy-icon" [class]="'energy-' + req.type">
                          {{ req.amount }}
                        </span>
                      }
                    </div>
                    <div class="attack-info">
                      <span class="attack-name">{{ attack.name }}</span>
                      <span class="attack-damage">{{ attack.damage }}</span>
                    </div>
                  </div>
                }
              </div>
            }

            @if (isSpecial(cardData) && cardData.ability) {
              <div class="card-ability">
                <div class="ability-text">{{ cardData.ability.text }}</div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .card {
      width: 200px;
      height: 280px;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      background: white;
      overflow: hidden;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    }

    .card-back {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-back-pattern {
      width: 80%;
      height: 80%;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
    }

    .card-front {
      padding: 12px;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%);
    }

    .energy-card {
      justify-content: center;
      align-items: center;
      gap: 16px;
    }

    .energy-symbol {
      font-size: 72px;
    }

    .energy-name {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      color: white;
    }

    .energy-fire {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    }

    .energy-water {
      background: linear-gradient(135deg, #4dabf7 0%, #339af0 100%);
    }

    .energy-grass {
      background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      gap: 8px;
    }

    .card-name {
      font-weight: bold;
      font-size: 14px;
      color: #212529;
      flex: 1;
      word-wrap: break-word;
    }

    .card-stats {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      font-size: 11px;
    }

    .card-type {
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: bold;
      color: white;
      text-transform: uppercase;
      font-size: 10px;
    }

    .type-fire {
      background-color: #ff6b6b;
    }

    .type-water {
      background-color: #4dabf7;
    }

    .type-grass {
      background-color: #51cf66;
    }

    .type-special {
      background-color: #9775fa;
    }

    .card-hp {
      font-weight: bold;
      color: #495057;
    }

    .card-image-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 8px 0;
      min-height: 80px;
    }

    .card-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .card-image-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-attacks {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: auto;
    }

    .attack {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 6px;
      border: 1px solid #dee2e6;
    }

    .attack-cost {
      display: flex;
      gap: 2px;
    }

    .energy-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: white;
    }

    .attack-info {
      display: flex;
      justify-content: space-between;
      flex: 1;
      font-size: 11px;
    }

    .attack-name {
      font-weight: bold;
      color: #495057;
    }

    .attack-damage {
      font-weight: bold;
      color: #e03131;
    }

    .card-ability {
      margin-top: auto;
      padding: 8px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 6px;
      border: 1px solid #dee2e6;
    }

    .ability-text {
      font-size: 11px;
      color: #495057;
      line-height: 1.4;
    }
  `]
})
export class CardComponent {
  card = input<Card | null>(null);
  faceDown = input<boolean>(false);

  protected isMonster = isMonsterCard;
  protected isSpecial = isSpecialCard;
  protected isEnergy = isEnergyCard;
}
