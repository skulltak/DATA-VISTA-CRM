import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1>Create Account</h1>
          <p>Join Data Vista CRM today</p>
        </div>
        
        <form (ngSubmit)="onRegister()" #registerForm="ngForm">
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              [(ngModel)]="user.username" 
              required 
              placeholder="Choose a username"
            >
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              [(ngModel)]="user.password" 
              required 
              minlength="6"
              placeholder="••••••••"
            >
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              name="confirmPassword" 
              [(ngModel)]="user.confirmPassword" 
              required 
              placeholder="••••••••"
            >
          </div>
          
          <button type="submit" class="register-button" [disabled]="!registerForm.form.valid || loading || user.password !== user.confirmPassword">
            <span *ngIf="!loading">Register</span>
            <span *ngIf="loading" class="spinner"></span>
          </button>
          
          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
          <div *ngIf="success" class="success-message">
            Registration successful! You can now <a routerLink="/login">log in</a>.
          </div>
        </form>
        
        <div class="register-footer">
          <p>Already have an account? <a routerLink="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #74ebd5 0%, #acb6e5 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    
    .register-card {
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
    
    .register-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .register-header h1 {
      margin: 0;
      color: #1a202c;
      font-size: 1.875rem;
      font-weight: 700;
    }
    
    .register-header p {
      color: #718096;
      margin-top: 0.5rem;
    }
    
    .form-group {
      margin-bottom: 1.25rem;
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
      border-color: #74ebd5;
      box-shadow: 0 0 0 3px rgba(116, 235, 213, 0.1);
    }
    
    .register-button {
      width: 100%;
      padding: 0.75rem;
      background: #74ebd5;
      color: #1a202c;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 1rem;
    }
    
    .register-button:hover:not(:disabled) {
      background: #64d8c1;
    }
    
    .register-button:disabled {
      background: #cbd5e0;
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
    
    .success-message {
      margin-top: 1rem;
      color: #38a169;
      background: #f0fff4;
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      text-align: center;
    }
    
    .register-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.875rem;
      color: #718096;
    }
    
    .register-footer a {
      color: #74ebd5;
      text-decoration: none;
      font-weight: 600;
    }
    
    .register-footer a:hover {
      text-decoration: underline;
    }
    
    .spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: #1a202c;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class RegisterComponent {
  user = {
    username: '',
    password: '',
    confirmPassword: ''
  };
  loading = false;
  error = '';
  success = false;

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    if (this.user.password !== this.user.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.success = false;
    console.log('Attempting registration for:', this.user.username);
    
    this.authService.register({
      username: this.user.username,
      password: this.user.password
    }).subscribe({
      next: (res) => {
        console.log('Registration successful');
        this.success = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.error = err.error?.message || err.message || 'Registration failed. Try again.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
