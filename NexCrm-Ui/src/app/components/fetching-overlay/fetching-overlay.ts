import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-fetching-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fetching-overlay" *ngIf="notification && (notification.type === 'fetching' || notification.type === 'success' || notification.type === 'error')">
      <div class="fetching-card" [class.success]="notification.type === 'success'" [class.error]="notification.type === 'error'">
        <div class="fetching-icon" *ngIf="notification.type === 'fetching'">
          <div class="loader"></div>
        </div>
        <div class="status-icon" *ngIf="notification.type === 'success'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="status-icon" *ngIf="notification.type === 'error'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
        <div class="fetching-content">
          <h3>{{ notification.type === 'fetching' ? 'FETCHING' : (notification.type === 'success' ? 'SUCCESS' : 'ERROR') }}</h3>
          <p>{{ notification.message }}</p>
        </div>
        <button class="close-btn" *ngIf="notification.type !== 'fetching'" (click)="close()">×</button>
      </div>
    </div>
  `,
  styles: [`
    .fetching-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    }

    .fetching-card {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 24px 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 24px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.1);
      max-width: 450px;
      position: relative;
    }

    .fetching-card.success {
      border-color: rgba(34, 197, 94, 0.4);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 197, 94, 0.1);
    }

    .fetching-card.error {
      border-color: rgba(239, 68, 68, 0.4);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.1);
    }

    .loader {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(56, 189, 248, 0.1);
      border-top: 3px solid #38bdf8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .status-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .success .status-icon { color: #22c55e; border: 2px solid #22c55e; }
    .error .status-icon { color: #ef4444; border: 2px solid #ef4444; }

    .fetching-content h3 {
      margin: 0;
      font-size: 11px;
      letter-spacing: 2px;
      color: #38bdf8;
      font-weight: 800;
    }

    .success .fetching-content h3 { color: #22c55e; }
    .error .fetching-content h3 { color: #ef4444; }

    .fetching-content p {
      margin: 4px 0 0;
      font-size: 15px;
      color: #cbd5e1;
      font-weight: 500;
    }

    .close-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: #64748b;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
    }

    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class FetchingOverlayComponent implements OnInit {
  notification: {message: string, type: string} | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe(notif => {
      this.notification = notif;
      
      // Auto-close success/error after 5 seconds
      if (notif && notif.type !== 'fetching') {
        setTimeout(() => {
          if (this.notification === notif) {
            this.close();
          }
        }, 5000);
      }
    });
  }

  close() {
    this.notificationService.clearNotification();
  }
}
