import {effect, Injectable, signal} from '@angular/core';
import {HttpHeaders, httpResource} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private client = signal(null);
  private credential = signal<string | null>(null);
  public token = signal<string | null>(sessionStorage.getItem("token"));

  constructor() {
    effect(() => {
      const state = this.data;
      if (state.value() && !state.isLoading()) {
        this.token.set(state.value()?.access_token || null);
        sessionStorage.setItem('token', `Bearer ${this.token()}`);
      }
    });
    effect(() => {
      if (this.client() && !this.token()) {
        google.accounts.id.prompt();
      }
    });
  }

  initAuth() {
    const client = google.accounts.id.initialize({
      client_id: '328564379068-sraopstko09uvcf8d2c8jla2ijimj3gh.apps.googleusercontent.com',
      ux_mode: 'popup',
      cancel_on_tap_outside: false,
      auto_select: false,
      callback: (response: any) => {
        if (response.credential) {
          this.credential.set(response.credential)
        } else {
          this.credential.set(null);
        }
      },
    });
    this.client.set(client)
  }

  logout() {
      sessionStorage.removeItem('token');
      this.token.set(null);
  }

  public data = httpResource<{access_token: string}>(() => {
    const credential = this.credential();
    if (!credential) return undefined;
    return {
      method: 'POST',
      url: 'http://project-15rpb.vercel.app/api/admin/login',
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${credential}`,
      })
    }
  });


}
