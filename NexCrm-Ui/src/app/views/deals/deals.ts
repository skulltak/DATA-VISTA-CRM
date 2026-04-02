import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DealService, Deal } from '../../services/deal';
import { Observable } from 'rxjs';

interface KanbanColumn {
  stage: string;
  label: string;
  deals: Deal[];
  color?: string;
}

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deals.html',
  styleUrl: './deals.css'
})
export class DealsComponent implements OnInit {
  columns: KanbanColumn[] = [
    { stage: 'Lead', label: 'Lead', deals: [] },
    { stage: 'Qualified', label: 'Qualified', deals: [] },
    { stage: 'Proposal', label: 'Proposal', deals: [] },
    { stage: 'Won', label: 'Won', deals: [], color: '#10b981' },
    { stage: 'Lost', label: 'Lost', deals: [], color: '#ef4444' }
  ];

  showModal = false;
  editingDeal: Deal = this.getEmptyDeal();

  constructor(private dealService: DealService) {}

  ngOnInit() {
    this.loadDeals();
  }

  loadDeals() {
    this.dealService.getDeals().subscribe({
      next: (deals) => {
        // Reset deals in columns
        this.columns.forEach(col => col.deals = []);
        
        // Group deals by stage
        deals.forEach(deal => {
          const col = this.columns.find(c => c.stage === deal.stage);
          if (col) col.deals.push(deal);
          else this.columns[0].deals.push(deal); // Default to Lead
        });
      }
    });
  }

  openAddModal() {
    this.editingDeal = this.getEmptyDeal();
    this.showModal = true;
  }

  openEditModal(deal: Deal) {
    this.editingDeal = { ...deal };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveDeal() {
    const obs: Observable<any> = this.editingDeal.id 
      ? this.dealService.updateDeal(this.editingDeal.id, this.editingDeal)
      : this.dealService.createDeal(this.editingDeal);

    obs.subscribe({
      next: () => {
        this.closeModal();
        this.loadDeals();
      }
    });
  }

  deleteDeal(id: string) {
    if (confirm('Are you sure you want to delete this deal?')) {
      this.dealService.deleteDeal(id).subscribe(() => this.loadDeals());
    }
  }

  getEmptyDeal(): Deal {
    return { title: '', company: '', value: 0, stage: 'Lead', contact: '', notes: '' };
  }

  // Basic drag and drop logic could be added here later with Angular CDK
}
