import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImportService } from '../../services/import';
import { ReportService, JopReportResult } from '../../services/report';

@Component({
  selector: 'app-jop-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jop-report.html',
  styleUrl: './jop-report.css'
})
export class JopReportComponent implements OnInit {
  files: any[] = [];
  selectedFileId: string | null = null;
  records: any[] = [];
  
  jobNames: string[] = [];
  selectedJobName: string = 'All';

  reportData: JopReportResult | null = null;

  constructor(
    private importService: ImportService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.importService.getFiles().subscribe(files => {
      this.files = files;
      if (files.length > 0 && !this.selectedFileId) {
        this.selectFile(files[0].id);
      }
    });
  }

  selectFile(id: string) {
    this.selectedFileId = id;
    this.importService.getRecords(id).subscribe({
      next: (res) => {
        const raw = res.records || [];
        if (raw.length === 0) {
          this.records = [];
          this.generateReport();
          return;
        }

        // Lazy-cache keys for iteration performance
        const keyMapCache: Record<string, string> = {};

        // Fast normalize keys
        this.records = raw.map((r: any) => {
          const norm: any = {};
          if (r) {
            for (const k in r) {
              norm[k] = r[k];
              if (!keyMapCache[k]) {
                keyMapCache[k] = k.replace(/\s+/g, '_').toUpperCase().trim();
              }
              norm[keyMapCache[k]] = r[k];
            }
          }
          return norm;
        });
        
        console.log("Data loaded:", this.records);
        // Reset filter
        this.selectedJobName = 'All';
        this.generateReport();
      },
      error: () => {
        this.records = [];
        this.reportData = null;
      }
    });
  }

  onFilterChange() {
    this.generateReport();
  }

  generateReport() {
    if (this.records.length === 0) {
      this.reportData = null;
      return;
    }
    
    this.reportData = this.reportService.generateJopReport(this.records, this.selectedJobName);
    this.jobNames = this.reportData.jobNames;
  }
}
