import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ImportService } from '../../services/import';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import.html',
  styleUrl: './import.css'
})
export class ImportComponent {
  selectedFile: File | null = null;
  importResult: any = null;
  isLoading = false;
  message = '';

  constructor(
    private importService: ImportService,
    private router: Router
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadFile(); // Auto-upload on selection for faster flow
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.uploadFile(); // Auto-upload on drop
    }
  }

  uploadFile() {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.message = 'Processing Amazon Report...';

    this.importService.upload(this.selectedFile).subscribe({
      next: (res) => {
        this.importResult = res;
        this.isLoading = false;
        this.message = 'Success! Routing to logs...';
        
        // Brief delay for feedback then auto-route
        setTimeout(() => {
          this.router.navigate(['/raw-data']);
        }, 800);
      },
      error: (err) => {
        this.isLoading = false;
        this.message = 'Error importing report. Please ensure it is a valid Amazon Job Report (.xlsx).';
        console.error(err);
      }
    });
  }

  cancelImport() {
    this.selectedFile = null;
    this.importResult = null;
    this.message = '';
  }
}
