import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection: signalR.HubConnection;
  private notificationSubject = new BehaviorSubject<{message: string, type: string} | null>(null);

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.apiUrl + '/notificationHub') // Match Render backend URL
      .withAutomaticReconnect()
      .build();

    this.startConnection();
    this.registerOnServerEvents();
  }

  private startConnection() {
    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connection Started'))
      .catch(err => console.error('Error while starting SignalR connection: ' + err));
  }

  private registerOnServerEvents() {
    this.hubConnection.on('ReceiveNotification', (message: string, type: string) => {
      this.notificationSubject.next({ message, type });
    });
  }

  get notifications$(): Observable<{message: string, type: string} | null> {
    return this.notificationSubject.asObservable();
  }

  notify(message: string, type: string = 'info') {
    this.notificationSubject.next({ message, type });
  }

  clearNotification() {
    this.notificationSubject.next(null);
  }
}
