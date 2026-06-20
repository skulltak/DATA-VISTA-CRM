import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesService } from '../../services/sales';

@Component({
  selector: 'app-sales-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-upload.html',
  styleUrl: './sales-upload.css'
})
export class SalesUploadComponent {
  selectedFile: File | null = null;
  importResult: any = null;
  isLoading = false;
  message = '';

  constructor(
    private salesService: SalesService,
    private router: Router
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadFile();
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
      this.uploadFile();
    }
  }

  uploadFile() {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.message = 'Processing Sales Data...';

    this.salesService.uploadSalesData(this.selectedFile).subscribe({
      next: (res) => {
        this.importResult = res;
        this.isLoading = false;
        this.message = 'Success! Data imported successfully.';
      },
      error: (err) => {
        this.isLoading = false;
        this.message = 'Error importing data. ' + (err.error?.message || err.message || err);
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
