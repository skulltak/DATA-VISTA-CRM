import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  isLoading = false;
  userInput = '';
  messages: Message[] = [
    { role: 'ai', text: 'Hello! I am your OpenAI-powered LangChain assistant. How can I help you today?' }
  ];

  constructor(private chatService: ChatService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userMsg = this.userInput.trim();
    this.messages.push({ role: 'user', text: userMsg });
    this.userInput = '';
    this.isLoading = true;

    this.chatService.sendMessage(userMsg).subscribe({
      next: (res) => {
        this.messages.push({ role: 'ai', text: res.response });
        this.isLoading = false;
      },
      error: (err) => {
        this.messages.push({ role: 'ai', text: 'Sorry, I encountered an error. Please check your API key and connection.' });
        this.isLoading = false;
      }
    });
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }
}
