import { Component } from '@angular/core';
import { GameBoardComponent } from './components/game-board.component';

@Component({
  selector: 'app-root',
  imports: [GameBoardComponent],
  template: `
    <app-game-board />
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class App {
}
