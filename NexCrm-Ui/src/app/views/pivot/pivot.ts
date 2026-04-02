import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImportService } from '../../services/import';
import { PivotService, PivotRequest } from '../../services/pivot';
import { Chart, registerables } from 'chart.js';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

Chart.register(...registerables);

@Component({
  selector: 'app-pivot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pivot.html',
  styleUrl: './pivot.css'
})
export class PivotComponent implements OnInit, AfterViewInit {
  @ViewChild('pivotChart') pivotChartCanvas!: ElementRef;
  private chart: any;

  files: any[] = [];
  selectedFileId = '';
  availableFields: string[] = [];

  rows: string[] = [];
  columns: string[] = [];
  valueConfigs: any[] = []; // Changed to ValueConfig list
  filters: string[] = [];
  
  aggregationType = 'sum';
  chartType = 'table'; 

  pivotData: any[] = [];
  columnHeaders: string[] = [];
  isLoading = false;

  constructor(
    private importService: ImportService,
    private pivotService: PivotService
  ) {}

  ngOnInit() {
    this.loadFiles();
  }

  ngAfterViewInit() {
    // Initial chart setup could go here if needed
  }

  loadFiles() {
    this.importService.getFiles().subscribe(files => {
      this.files = files;
      if (files.length > 0 && !this.selectedFileId) {
        this.selectedFileId = files[0].id;
        this.onFileChange();
      }
    });
  }

  onFileChange() {
    if (!this.selectedFileId) return;
    this.isLoading = true;
    this.importService.getHeaders(this.selectedFileId).subscribe({
      next: (headers) => {
        this.availableFields = headers;
        this.isLoading = false;
        this.clearPivot();
      },
      error: () => this.isLoading = false
    });
  }

  addField(field: string, target: 'rows' | 'columns' | 'values' | 'filters') {
    if (target === 'rows' && !this.rows.includes(field)) this.rows.push(field);
    if (target === 'columns' && !this.columns.includes(field)) this.columns.push(field);
    if (target === 'values') {
      // Allow multiple instances of same field with different aggs
      this.valueConfigs.push({ field: field, type: this.aggregationType });
    }
    if (target === 'filters' && !this.filters.includes(field)) this.filters.push(field);
  }

  removeField(field: any, target: 'rows' | 'columns' | 'values' | 'filters') {
    if (target === 'rows') this.rows = this.rows.filter(f => f !== field);
    if (target === 'columns') this.columns = this.columns.filter(f => f !== field);
    if (target === 'values') this.valueConfigs = this.valueConfigs.filter(f => f !== field);
    if (target === 'filters') this.filters = this.filters.filter(f => f !== field);
  }

  resetPivot() {
    this.clearPivot();
    this.valueConfigs = [];
    this.filters = [];
  }

  buildPivot() {
    if (!this.selectedFileId || (this.rows.length === 0 && this.columns.length === 0)) return;

    this.isLoading = true;
    
    const request: PivotRequest = {
      fileId: this.selectedFileId,
      rows: this.rows,
      columns: this.columns,
      values: this.valueConfigs.length > 0 ? this.valueConfigs : [{ field: '', type: 'count' }]
    };

    this.pivotService.build(request).subscribe({
      next: (data) => {
        // Sort rows alphanumerically by key
        this.pivotData = data.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: 'base' }));
        this.columnHeaders = this.extractColumnHeaders(data);
        this.isLoading = false;
        
        if (this.chartType !== 'table') {
          setTimeout(() => this.renderChart(), 0);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  renderChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.pivotChartCanvas) return;

    const ctx = this.pivotChartCanvas.nativeElement.getContext('2d');
    const labels = this.pivotData.map(d => d.key);
    
    // For simplicity, we use the first value in each row's values object
    // or sum them up if multiple columns exist
    const datasets = this.columnHeaders.map((col, idx) => ({
      label: col,
      data: this.pivotData.map(d => d.values[col] || 0),
      backgroundColor: idx === 0 ? '#6366f1' : idx === 1 ? '#22d3ee' : '#f59e0b',
      borderRadius: 4
    }));

    this.chart = new Chart(ctx, {
      type: this.chartType === 'bar' ? 'bar' : 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8' }
          }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  extractColumnHeaders(data: any[]): string[] {
    const headers = new Set<string>();
    data.forEach(row => {
      if (row.values) {
        Object.keys(row.values).forEach(k => headers.add(k));
      }
    });
    // Sort columns alphanumerically
    return Array.from(headers).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }

  metricHeaders(): string[] {
    if (this.pivotData.length === 0) return [];
    const firstRow = this.pivotData[0];
    const firstColKey = this.columnHeaders[0];
    const metrics = firstRow.values[firstColKey];
    return metrics ? Object.keys(metrics) : [];
  }

  getRowTotal(row: any, metric: string): number {
    return Object.values(row.values).reduce((acc: number, val: any) => acc + (val?.[metric] || 0), 0);
  }

  getColTotal(col: string, metric: string): number {
    return this.pivotData.reduce((acc: number, row: any) => acc + (row.values[col]?.[metric] || 0), 0);
  }

  getGrandTotal(metric: string): number {
    return this.pivotData.reduce((acc: number, row: any) => acc + this.getRowTotal(row, metric), 0);
  }

  clearPivot() {
    this.pivotData = [];
    this.columnHeaders = [];
  }

  clearAll() {
    this.rows = [];
    this.columns = [];
    this.valueConfigs = [];
    this.clearPivot();
  }

  async downloadFinalReport() {
    if (!this.selectedFileId || this.pivotData.length === 0) return;

    this.isLoading = true;
    const workbook = new ExcelJS.Workbook();
    
    // Tab 1: Raw Data
    const rawSheet = workbook.addWorksheet('Raw Data');
    this.importService.getRecords(this.selectedFileId).subscribe(async (res: any) => {
      const records = res.records;
      if (records && records.length > 0) {
        const headers = Object.keys(records[0]);
        rawSheet.addRow(headers);
        records.forEach((r: any) => rawSheet.addRow(Object.values(r)));
      }

      // Tab 2: Pivot Table
      const pivotSheet = workbook.addWorksheet('Pivot Summary');
      const metrics = this.metricHeaders();
      
      // Header Rows
      const h1 = [this.rows.join(' / ')];
      this.columnHeaders.forEach(col => metrics.forEach(() => h1.push(col)));
      metrics.forEach(() => h1.push('Grand Total'));
      pivotSheet.addRow(h1);

      const h2 = [''];
      this.columnHeaders.forEach(() => metrics.forEach(m => h2.push(m)));
      metrics.forEach(m => h2.push(m));
      pivotSheet.addRow(h2);
      
      this.pivotData.forEach(row => {
        const rowData = [row.key];
        this.columnHeaders.forEach(col => {
          metrics.forEach(m => rowData.push(row.values[col]?.[m] || 0));
        });
        metrics.forEach(m => rowData.push(this.getRowTotal(row, m)));
        pivotSheet.addRow(rowData);
      });

      // Tab 3: Analytics (Chart Image)
      const chartSheet = workbook.addWorksheet('Analytics');
      if (this.chart) {
        const base64Image = this.chart.toBase64Image();
        const imageId = workbook.addImage({
          base64: base64Image,
          extension: 'png',
        });
        chartSheet.addImage(imageId, 'B2:L20');
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Data_Vista_Report_Final_${new Date().getTime()}.xlsx`);
      
      this.isLoading = false;
    });
  }
}
