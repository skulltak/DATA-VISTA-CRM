import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesService } from '../../services/sales';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  kpis: any = {
    overallRevenue: 0,
    storeShare: 0,
    vecareShare: 0
  };
  salesRecords: any[] = [];
  isLoading = true;

  constructor(private salesService: SalesService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.salesService.getDashboardData().subscribe({
      next: (data) => {
        this.kpis = data.kpis;
        this.salesRecords = data.records;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard data', err);
        this.isLoading = false;
      }
    });
  }
}
