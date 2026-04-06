import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Welcome Back</h1>
          <p>Login to access your CRM dashboard</p>
        </div>
        
        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              [(ngModel)]="credentials.username" 
              required 
              placeholder="Enter your username"
            >
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              [(ngModel)]="credentials.password" 
              required 
              placeholder="••••••••"
            >
          </div>
          
          <button type="submit" class="login-button" [disabled]="!loginForm.form.valid || loading">
            <span *ngIf="!loading">Sign In</span>
            <span *ngIf="loading" class="spinner"></span>
          </button>
          
          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
        </form>
        
        <div class="login-footer">
          <p>Don't have an account? <a routerLink="/register">Register here</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    
    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
      animation: fadeIn 0.5s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .login-header h1 {
      margin: 0;
      color: #1a202c;
      font-size: 1.875rem;
      font-weight: 700;
    }
    
    .login-header p {
      color: #718096;
      margin-top: 0.5rem;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #4a5568;
      font-weight: 500;
      font-size: 0.875rem;
    }
    
    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: all 0.2s;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .login-button {
      width: 100%;
      padding: 0.75rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .login-button:hover:not(:disabled) {
      background: #5a67d8;
    }
    
    .login-button:disabled {
      background: #a0aec0;
      cursor: not-allowed;
    }
    
    .error-message {
      margin-top: 1rem;
      color: #e53e3e;
      background: #fff5f5;
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      text-align: center;
    }
    
    .login-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.875rem;
      color: #718096;
    }
    
    .login-footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    
    .login-footer a:hover {
      text-decoration: underline;
    }
    
    .spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
  credentials = {
    username: '',
    password: ''
  };
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.loading = true;
    this.error = '';
    console.log('Attempting login for:', this.credentials.username);
    
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        console.log('Login successful:', res.username);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login error:', err);
        const statusMsg = err.status ? `(Status: ${err.status}) ` : '';
        this.error = `${statusMsg}${err.error?.message || err.message || 'Login failed. Please check your credentials or connection.'}`;
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
