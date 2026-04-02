import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileViewerService, ParsedFile, SheetData } from '../../services/file-viewer';
import { FormsModule } from '@angular/forms';
import { PivotEngineService, TriplePivotResult } from '../../services/pivot-engine';
import { NotificationService } from '../../services/notification.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PdfExportService } from '../../services/pdf-export.service';

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './file-viewer.html',
  styleUrl: './file-viewer.css'
})
export class FileViewerComponent implements OnInit {
  files: ParsedFile[] = [];
  
  // Viewer State
  activeFileId: string | null = null;
  activeFile: ParsedFile | null = null;
  activeSheetIndex: number = 0;
  
  isDragging = false;
  isUploading = false;
  isSaving = false;
  isEditing = false; 
  isCompareMode = false;
  compareFileId: string | null = null;
  compareFile: ParsedFile | null = null;
  compareSheetIndex: number = 0;

  parsedRecords: any[] = [];
  activePivots: TriplePivotResult | null = null;
  selectedPivotJobName: string = 'All';
  selectedCategory: 'ALL' | 'TVLA' | 'AC' = 'ALL';
  viewMode: 'raw' | 'pivots' = 'raw';

  constructor(
    private fileViewerService: FileViewerService,
    private pivotEngine: PivotEngineService,
    private notificationService: NotificationService,
    private router: Router,
    private pdfExportService: PdfExportService
  ) {}

  async ngOnInit() {
    await this.loadFiles();
    
    // Reset view if user clicks sidebar link while already on this page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url === '/file-viewer') {
        this.closeSheetViewer();
      }
    });

    // Auto-refresh file list when a successful sync occurs
    this.notificationService.notifications$.subscribe(notif => {
      if (notif && notif.type === 'success') {
        this.loadFiles();
      }
    });
  }

  async loadFiles() {
    this.files = await this.fileViewerService.getFiles();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      await this.handleFileUpload(event.dataTransfer.files[0]);
    }
  }

  async onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      await this.handleFileUpload(target.files[0]);
      target.value = ''; // reset input
    }
  }

  async handleFileUpload(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      alert('Only .xlsx and .csv files are supported.');
      return;
    }

    this.isUploading = true;
    try {
      await this.fileViewerService.uploadFile(file);
      await this.loadFiles();
      alert('IMPORT_SUCCESS: Intelligence synced to vault.');
      // Optionally open the file immediately:
      // this.openSheetViewer(parsed.id);
    } catch (e) {
      alert('Failed to parse file: ' + e);
    } finally {
      this.isUploading = false;
    }
  }

  async openSheetViewer(fileId: string) {
    this.activeFileId = fileId;
    this.activeFile = (await this.fileViewerService.getFile(fileId)) || null;
    this.activeSheetIndex = 0;
    this.processPivots();
  }

  closeSheetViewer() {
    this.activeFileId = null;
    this.activeFile = null;
    this.isCompareMode = false;
    this.compareFile = null;
  }

  toggleCompareMode() {
    this.isCompareMode = !this.isCompareMode;
    if (!this.isCompareMode) {
      this.compareFile = null;
      this.compareFileId = null;
    }
  }

  async onCompareFileSelected(event: any) {
    const fileId = event.target.value;
    if (fileId) {
      this.compareFileId = fileId;
      this.compareFile = (await this.fileViewerService.getFile(fileId)) || null;
      this.compareSheetIndex = 0;
    }
  }

  selectCompareSheet(index: number) {
    this.compareSheetIndex = index;
  }

  selectSheet(index: number) {
    this.activeSheetIndex = index;
    this.processPivots();
  }

  processPivots() {
    this.activePivots = null;
    this.parsedRecords = [];
    this.viewMode = 'raw';
    
    const sheet = this.activeSheet;
    if (!sheet || !sheet.data || sheet.data.length < 2) return;

    const rawHeaders = sheet.data[0];
    const keyMapCache: Record<string, string> = {};

    this.parsedRecords = sheet.data.slice(1).map(row => {
      const obj: any = {};
      if (row) {
        rawHeaders.forEach((h, i) => {
          if (h !== undefined && h !== null) {
            if (!keyMapCache[h]) {
              keyMapCache[h] = h.toString().replace(/\s+/g, '_').toUpperCase().trim();
            }
            obj[keyMapCache[h]] = row[i];
          }
        });
      }
      return obj;
    });

    this.activePivots = this.pivotEngine.generatePivots(this.parsedRecords, this.selectedPivotJobName, this.selectedCategory);
    
    if (this.activePivots && this.activePivots.summary.rows.length > 0) {
      this.viewMode = 'pivots';
    }
  }

  getPercentageClass(pct: number): string {
    if (pct >= 80) return 'pct-high';
    if (pct >= 60) return 'pct-mid';
    if (pct >= 40) return 'pct-low';
    return 'pct-critical';
  }

  getDiffClass(diff: number): string {
    if (diff === 0) return 'diff-zero';
    return diff > 0 ? 'diff-pos' : 'diff-neg';
  }

  onPivotFilterChange() {
    if (this.parsedRecords.length > 0) {
      this.activePivots = this.pivotEngine.generatePivots(this.parsedRecords, this.selectedPivotJobName, this.selectedCategory);
    }
  }

  get activeSheet(): SheetData | null {
    if (!this.activeFile || !this.activeFile.sheets || this.activeFile.sheets.length === 0) return null;
    return this.activeFile.sheets[this.activeSheetIndex];
  }

  get compareSheet(): SheetData | null {
    if (!this.compareFile || !this.compareFile.sheets || this.compareFile.sheets.length === 0) return null;
    return this.compareFile.sheets[this.compareSheetIndex];
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  isHighlightedColumn(header: string): boolean {
    const upper = typeof header === 'string' ? header.toUpperCase() : '';
    return upper === 'SERVICE_ORDER_ID' || 
           upper === 'TECHNICIAN_ASSIGNMENT_STATUS' || 
           upper === 'STATE';
  }

  async deleteFile(id: string, event: Event) {
    event.stopPropagation();
    if(confirm('Are you sure you want to delete this file?')) {
      await this.fileViewerService.deleteFile(id);
      await this.loadFiles();
      if(this.activeFileId === id) {
         this.closeSheetViewer();
      }
    }
  }

  onCellEdit(rowIndex: number, colIndex: number, event: any) {
    if (!this.activeFile || !this.activeSheet) return;
    const newValue = event.target.innerText;
    this.activeSheet.data[rowIndex][colIndex] = newValue;
  }

  async saveChanges() {
    if (!this.activeFile) return;
    this.isSaving = true;
    try {
      await this.fileViewerService.updateFile(this.activeFile);
      this.processPivots(); // Re-process pivots with new data
      alert('TELEMETRY_SYNC_COMPLETE: Changes persisted to database.');
    } catch (e) {
      alert('SYNC_ERROR: Failed to save changes.');
    } finally {
      this.isSaving = false;
    }
  }

  getColLabel(index: number): string {
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode((index % 26) + 65) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  }

  async exportPdf() {
    if (!this.activeFile || this.parsedRecords.length === 0) return;
    try {
      await this.pdfExportService.exportIntelligenceReport(this.parsedRecords, this.activeFile.name);
    } catch (e) {
      alert('PDF_EXPORT_ERROR: ' + e);
    }
  }
}
