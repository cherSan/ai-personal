import {Component, ElementRef, inject, signal, ViewChild} from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: Date;
  error?: boolean;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLElement>;

  private readonly http = inject(HttpClient);

  readonly value = signal('');
  readonly loading = signal(false);

  readonly messages = signal<Message[]>([
    {
      role: 'assistant',
      text: 'Hello! I can help you find information in Aleksandr Chernushevich\'s personal knowledge base.',
      timestamp: new Date(),
    }
  ]);

  private scrollToBottom(
    behavior: ScrollBehavior = 'smooth'
  ): void {

    requestAnimationFrame(() => {

      const container = this.messagesContainer?.nativeElement;

      if (!container) {
        return;
      }

      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });

    });
  }

  onSubmit(): void {

    const question = this.value().trim();

    if (!question || this.loading()) {
      return;
    }

    this.messages.update(messages => [
      ...messages,
      {
        role: 'user',
        text: question,
        timestamp: new Date(),
      },
    ]);

    this.scrollToBottom();

    this.value.set('');
    this.loading.set(true);

    this.http.post<any>(
      '/api/personal-documents/search',
      {
        q: question,
      }
    )
      .subscribe({
        next: response => {

          const answer =
            response?.answer ??
            response?.text ??
            response?.message ??
            JSON.stringify(response, null, 2);

          this.addAnimatedAssistantMessage(answer);
        },

        error: error => {

          console.error(error);

          this.messages.update(messages => [
            ...messages,
            {
              role: 'assistant',
              text: 'Sorry, an error occurred while processing your request.',
              timestamp: new Date(),
              error: true,
            },
          ]);

          this.scrollToBottom();

          this.loading.set(false);
        },
      });
  }

  private addAnimatedAssistantMessage(text: string): void {

    this.messages.update(messages => [
      ...messages,
      {
        role: 'assistant',
        text: '',
        timestamp: new Date(),
      },
    ]);
    let currentIndex = 0;

    const timer = setInterval(() => {

      this.messages.update(messages => {

        const updated = [...messages];

        updated[updated.length - 1] = {
          role: 'assistant',
          text: text.slice(0, currentIndex + 1),
        };

        this.scrollToBottom();

        return updated;
      });

      currentIndex++;

      if (currentIndex >= text.length) {
        clearInterval(timer);
        this.loading.set(false);
      }

    }, 8);
  }
}
