import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class TopbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  breadcrumb = 'Dashboard';

  onHamburgerClick() {
    this.toggleSidebar.emit();
  }
}
