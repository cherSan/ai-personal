import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {

  private readonly http = inject(HttpClient);

  readonly value = signal('');
  readonly loading = signal(false);

  readonly messages = signal<Message[]>([
    {
      role: 'assistant',
      text: 'Hello! I can help you find information in Aleksandr Chernushevich\'s personal knowledge base.'
    }
  ]);

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
      },
    ]);

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
            },
          ]);

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
