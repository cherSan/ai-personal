import {Component, signal} from '@angular/core';
import {HttpHeaders, httpResource} from "@angular/common/http";

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  value = signal('');
  text = signal<string | undefined>(undefined)

  onSubmit() {
    console.log(this.value());
    this.text.set(this.value());
  }

  public data = httpResource(() => {
    const text = this.text();
    console.log(123, text)
    if (!text) return undefined;
    return {
      method: 'POST',
      url: 'http://project-15rpb.vercel.app/api/personal-documents/search',
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
