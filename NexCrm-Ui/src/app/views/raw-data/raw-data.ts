import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImportService } from '../../services/import';

@Component({
  selector: 'app-raw-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './raw-data.html',
  styleUrl: './raw-data.css'
})
export class RawDataComponent implements OnInit {
  files: any[] = [];
  selectedFileId: string | null = null;
  records: any[] = [];
  headers: string[] = [
    'ORDER_CREATED_TIME', 'SERVICE_ORDER_ID', 'JOB_ID', 'SERVICE_ASIN', 'JOB_NAME',
    'JOB_STATUS', 'APPOINTMENT_DATE', 'APPOINTMENT_START_TIME', 'APPOINTMENT_END_TIME',
    'PRODUCT_ORDER_ID', 'PRODUCT_ASIN', 'PRODUCT_NAME', 'PRODUCT_QUANTITY_PURCHASED',
    'PRODUCT_ORDER_STATUS', 'PRODUCT_BRAND', 'PRODUCT_TYPE', 'PRODUCT_CATEGORY',
    'PRODUCT_MODEL_NUMBER', 'PRODUCT_SERIAL_NUMBER', 'PRODUCT_ESTIMATED_DELIVERY_DATE',
    'DEVICE_SERIAL_NUMBER', 'DEVICE_SERIAL_NUMBER_TYPE', 'TECHNICIAN',
    'TECHNICIAN_ASSIGNMENT_STATUS', 'BUYER_PHONE_NUMBER', 'SHIP_ADDRESS_LINE_1',
    'SHIP_ADDRESS_LINE_2', 'SHIP_ADDRESS_LINE_3', 'SHIP_POSTAL_CODE', 'SHIP_CITY',
    'COVERAGE_AREA', 'BUYER_ID', 'DEFECT', 'BUYER_NAME', 'SKU',
    'CAPTURED_PRODUCT_SERIAL_NUMBER', 'STATE'
  ];
  search = '';

  constructor(private importService: ImportService) {}

  ngOnInit() {
    this.loadFiles();
  }

  loadFiles() {
    this.importService.getFiles().subscribe(files => {
      this.files = files;
      if (files.length > 0 && !this.selectedFileId) {
        this.selectFile(files[0].id);
      }
    });
  }

  currentPage = 1;
  pageSize = 50;

  get paginatedRecords() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRecords.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredRecords.length / this.pageSize) || 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  get minRecordCount() {
    return Math.min(this.currentPage * this.pageSize, this.filteredRecords.length);
  }

  selectFile(id: string) {
    this.selectedFileId = id;
    this.importService.getRecords(id).subscribe({
      next: (res) => {
        const rawRecords = res.records || [];
        if (rawRecords.length === 0) {
          this.records = [];
          return;
        }

        // Lazy-cache keys to prevent missing columns if row 0 is sparse
        const keyMapCache: Record<string, string> = {};

        // Fast mapping using the cache
        this.records = rawRecords.map((r: any) => {
          const normalized: any = {};
          if (r) {
            for (const k in r) {
              normalized[k] = r[k];
              if (!keyMapCache[k]) {
                // Determine clean key and cache it
                keyMapCache[k] = k.replace(/\s+/g, '_').toUpperCase().trim();
              }
              // Map against cached clean key
              normalized[keyMapCache[k]] = r[k];
            }
          }
          return normalized;
        });

        this.currentPage = 1;
      },
      error: () => {
        this.records = [];
      }
    });
  }

  get filteredRecords() {
    if (!this.search) return this.records;
    const s = this.search.toLowerCase();
    return this.records.filter(r => 
      Object.values(r).some(v => v?.toString().toLowerCase().includes(s))
    );
  }

  exportToCsv() {
    if (this.records.length === 0) return;

    const csvRows = [];
    // Headers
    csvRows.push(this.headers.join(','));

    // Data
    for (const row of this.records) {
      const values = this.headers.map(h => {
        const val = row[h];
        const escaped = ('' + (val || '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
