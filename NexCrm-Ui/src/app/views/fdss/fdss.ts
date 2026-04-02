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
  selector: 'app-fdss',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fdss.html',
  styleUrl: './fdss.css'
})
export class FDSSComponent implements OnInit {
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
  
  parsedRecords: any[] = []; // Full sheet records
  filteredRecords: any[] = []; // Filtered for intersection
  filteredRawRows: any[][] = []; // Raw rows for grid display
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
      if (this.router.url === '/fdss') {
        this.closeSheetViewer();
      }
    });
    
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
      target.value = ''; 
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
      alert('FDSS_IMPORT_SUCCESS: Intelligence synced to vault.');
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
      this.processPivots(); // RE-PIVOT ON SELECTION
    }
  }

  selectCompareSheet(index: number) {
    this.compareSheetIndex = index;
    this.processPivots(); // RE-PIVOT ON SHEET CHANGE
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

    this.filteredRecords = [...this.parsedRecords];
    this.filteredRawRows = sheet.data.slice(1);

    // SERVICE ORDER ID INTERSECTION LOGIC
    if (this.isCompareMode && this.compareSheet) {
      const secondaryData = this.compareSheet.data;
      if (secondaryData.length >= 2) {
        const secHeaders = secondaryData[0].map((h: any) => h?.toString().replace(/\s+/g, '_').toUpperCase().trim());
        const secOrderIdIndex = secHeaders.indexOf('SERVICE_ORDER_ID');
        
        if (secOrderIdIndex !== -1) {
          const secOrderIds = new Set(
            secondaryData.slice(1)
              .map(row => row[secOrderIdIndex]?.toString().trim())
              .filter(id => !!id)
          );
          
          this.filteredRecords = this.parsedRecords.filter((p, idx) => {
            const pid = p['SERVICE_ORDER_ID']?.toString().trim();
            const matched = pid && secOrderIds.has(pid);
            if (!matched) {
              // Mark indices to remove from raw rows or just build new list
            }
            return matched;
          });

          // Build filtered raw rows matching the filtered records
          const secOrderIdsList = Array.from(secOrderIds);
          const priHeaders = sheet.data[0].map((h: any) => h?.toString().replace(/\s+/g, '_').toUpperCase().trim());
          const priOrderIdIndex = priHeaders.indexOf('SERVICE_ORDER_ID');
          
          if (priOrderIdIndex !== -1) {
             this.filteredRawRows = sheet.data.slice(1).filter(row => {
               const rid = row[priOrderIdIndex]?.toString().trim();
               return rid && secOrderIds.has(rid);
             });
          }
        }
      }
    }

    this.activePivots = this.pivotEngine.generatePivots(this.filteredRecords, this.selectedPivotJobName, this.selectedCategory);
    
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
    this.processPivots();
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
      this.processPivots();
      alert('FDSS_DATA_SYNC_COMPLETE');
    } catch (e) {
      alert('SYNC_ERROR');
    } finally {
      this.isSaving = false;
    }
  }

  async exportPdf() {
    if (!this.activeFile || this.filteredRecords.length === 0) return;
    try {
      // Use filteredRecords to ensure comparison logic is reflected in PDF
      await this.pdfExportService.exportIntelligenceReport(this.filteredRecords, this.activeFile.name);
    } catch (e) {
      alert('PDF_EXPORT_ERROR: ' + e);
    }
  }
}
