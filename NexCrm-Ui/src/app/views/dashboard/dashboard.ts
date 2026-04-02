import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ImportService } from '../../services/import';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  isDragging = false;
  isUploading = false;

  constructor(
    private importService: ImportService,
    private router: Router
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFileUpload(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFileUpload(target.files[0]);
      target.value = ''; // reset input
    }
  }

  handleFileUpload(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      alert('Only .xlsx and .csv files are supported.');
      return;
    }

    this.isUploading = true;
    this.importService.upload(file).subscribe({
      next: () => {
        this.isUploading = false;
        alert('Data fetched and imported successfully! Navigating to Raw Data...');
        this.router.navigate(['/raw-data']);
      },
      error: (err) => {
        this.isUploading = false;
        alert('Failed to parse file: ' + err.message);
      }
    });
  }
}
