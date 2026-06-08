import {AfterViewInit, Component, computed, effect, ElementRef, inject, signal, ViewChild} from '@angular/core';
import {LoginService} from "./login.service";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {NzInputDirective, NzTextareaCountComponent} from "ng-zorro-antd/input";
import {NzColDirective} from "ng-zorro-antd/grid";
import {MarkdownComponent} from "ngx-markdown";
import {form, FormField, FormRoot, required} from '@angular/forms/signals';
import {HttpHeaders, httpResource} from "@angular/common/http";

@Component({
  imports: [
    NzButtonComponent,
    NzFormDirective,
    NzInputDirective,
    NzFormControlComponent,
    NzFormLabelComponent,
    NzFormItemComponent,
    NzColDirective,
    MarkdownComponent,
    NzTextareaCountComponent,
    FormField,
    FormRoot
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements AfterViewInit {
  @ViewChild('login') loginElement!: ElementRef;
  loginService = inject(LoginService);
  saveData = signal<any>(null);
  data = signal({
    title: '',
    text: '',
    meta: {
      section: ''
    }
  });
  form = form(
    this.data,
    (f) => {
      required(f.text, {message: 'text is required'})
      required(f.meta.section, {message: 'section is required'})
      required(f.title, {message: 'title is required'})
    },
    {
      submission: {
        action: async () => {
          this.saveData.set(this.data());
        },
      }
    }
  );

  public insert = httpResource(() => {
    const data = this.saveData();
    const t = sessionStorage.getItem('token');
    console.log(data, t);
    if (!data || !t) return undefined;
    return {
      method: 'POST',
      url: 'https://project-15rpb-git-master-chersans-projects.vercel.app/api/personal-documents',
      body: data,
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': t,
      })
    }
  });

  isAuth = computed(() => this.loginService.token())
  constructor() {
    effect(() => {
      const auth = this.isAuth();
      if (!auth && this.loginElement) {
        this.renderGoogleButton();
      }
    });
  }

  ngAfterViewInit(): void {
    if (typeof google !== 'undefined') {
      this.loginService.initAuth();
      if(!this.isAuth()) {
        this.renderGoogleButton();
      }
    }
  }

  private renderGoogleButton() {
    if (this.loginElement?.nativeElement) {
      google.accounts.id.renderButton(
        this.loginElement.nativeElement,
        {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "signin_with",
          logo_alignment: "left"
        }
      );
    }
  }

  protected readonly JSON = JSON;
}
