import {Component, ElementRef, inject, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {MarkdownComponent} from "ngx-markdown";

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: Date;
  error?: boolean;
  tokens?: {
    "input_tokens"?: number,
    "output_tokens"?: number,
    "total_tokens"?: number
  }
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
  imports: [
    MarkdownComponent
  ]
})
export class Chat {
  private readonly hostElementRef = inject(ElementRef<HTMLElement>);

  private readonly http = inject(HttpClient);

  readonly value = signal('');
  readonly loading = signal(false);

  readonly messages = signal<Message[]>([
    {
      role: 'assistant',
      text: `### Hello!
I can help you find information in Aleksandr Chernushevich\'s personal knowledge base.
`,
      timestamp: new Date(),
    }
  ]);

  private scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    requestAnimationFrame(() => {
      const container = this.hostElementRef.nativeElement;

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
      '/api/agent',
      {
        q: question,
      }
    )
      .subscribe({
        next: response => {

          const answer =
            response?.m ??
            JSON.stringify(response, null, 2);

          const tokens = response.usage_metadata

          this.addAnimatedAssistantMessage(answer, tokens);
        },

        error: error => {

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

  private addAnimatedAssistantMessage(text: string, tokens?: any): void {

    this.messages.update(messages => [
      ...messages,
      {
        role: 'assistant',
        text: '',
        timestamp: new Date(),
        tokens,
      },
    ]);
    let currentIndex = 0;

    const timer = setInterval(() => {

      this.messages.update(messages => {

        const updated = [...messages];

        updated[updated.length - 1] = {
          role: 'assistant',
          text: text.slice(0, currentIndex + 1),
          timestamp: new Date(),
          tokens,
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
