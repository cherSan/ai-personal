import {Component, signal} from '@angular/core';
import {HttpHeaders, httpResource} from "@angular/common/http";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  value = signal('');
  text = signal<string | undefined>(undefined)

  onSubmit() {
    this.text.set(this.value());
  }

  public data = httpResource(() => {
    const text = this.text();
    if (!text) return undefined;
    return {
      method: 'POST',
      url: 'https://project-15rpb.vercel.app/api/personal-documents/search',
      body: {
        q: text,
      },
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      })
    }
  });
}
