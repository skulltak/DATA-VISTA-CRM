import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './components/chat/chat';
import { IntroComponent } from './components/intro/intro';
import { FetchingOverlayComponent } from './components/fetching-overlay/fetching-overlay';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule, CommonModule, ChatComponent, IntroComponent, FetchingOverlayComponent],
  template: `
    <app-intro *ngIf="showIntro" (finished)="showIntro = false"></app-intro>
    
    <ng-container *ngIf="!showIntro">
      <router-outlet></router-outlet>
      <app-chat></app-chat>
      <app-fetching-overlay></app-fetching-overlay>
    </ng-container>
  `
})
export class App {
  showIntro = true;
}
