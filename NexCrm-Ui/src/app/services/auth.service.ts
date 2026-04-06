import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  token: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/api/auth';
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('AuthService initialized with API URL:', this.apiUrl);
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
    this.checkConnection();
  }

  checkConnection(): void {
    this.http.get(`${this.apiUrl}/ping`).subscribe({
      next: (res) => console.log('Backend connection verified:', res),
      error: (err) => console.error('Backend connection FAILED. API URL may be incorrect or server is down.', err)
    });
  }

  public get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value?.token;
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.currentUserValue?.token || null;
  }
}
