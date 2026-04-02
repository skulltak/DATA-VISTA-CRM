import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, Contact } from '../../services/contact';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css'
})
export class ContactsComponent implements OnInit {
  contacts: Contact[] = [];
  search = '';
  page = 1;
  pageSize = 15;
  totalCount = 0;
  
  showModal = false;
  editingContact: Contact = this.getEmptyContact();

  constructor(private contactService: ContactService) {}

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    this.contactService.getContacts(this.search, this.page, this.pageSize).subscribe({
      next: (data) => {
        this.contacts = data;
        // In a real app, we'd get X-Total-Count from headers.
        // For now, we'll approximate or use a secondary count call if needed.
        this.totalCount = data.length; // Placeholder
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.loadContacts();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadContacts();
    }
  }

  nextPage() {
    this.page++;
    this.loadContacts();
  }

  openAddModal() {
    this.editingContact = this.getEmptyContact();
    this.showModal = true;
  }

  openEditModal(contact: Contact) {
    this.editingContact = { ...contact };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveContact() {
    const obs: Observable<any> = this.editingContact.id 
      ? this.contactService.updateContact(this.editingContact.id, this.editingContact)
      : this.contactService.createContact(this.editingContact);

    obs.subscribe({
      next: () => {
        this.closeModal();
        this.loadContacts();
      }
    });
  }

  deleteContact(id: string) {
    if (confirm('Are you sure you want to delete this contact?')) {
      this.contactService.deleteContact(id).subscribe(() => this.loadContacts());
    }
  }

  private getEmptyContact(): Contact {
    return { name: '', email: '', company: '', phone: '', status: 'Lead', notes: '' };
  }
}
