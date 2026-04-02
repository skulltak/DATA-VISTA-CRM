import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:5032/api/chat'; // Default local API URL

  constructor(private http: HttpClient) {
    // If running in production (Render), use the full backend URL
    if (window.location.hostname !== 'localhost') {
      this.apiUrl = environment.apiUrl + '/api/chat';
    }
  }

  sendMessage(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, { message });
  }
}
