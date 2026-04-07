import { environment } from '../../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HttpClientModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  isOpen = false;
  dbStatus: string | null = null;
  currentUser$!: Observable<any>;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit() {
    this.checkDbStatus();
    setInterval(() => this.checkDbStatus(), 30000);
  }

  checkDbStatus() {
    this.http.get<{status: string}>(environment.apiUrl + '/api/health/db')
      .subscribe({
        next: (res) => this.dbStatus = res.status,
        error: () => this.dbStatus = 'disconnected'
      });
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  openVistaPortal() {
    window.open('https://sellercentral.amazon.in/hz/local-services-reports/job-reports/ref=xx_vasjbr_favb_xx', '_blank');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
