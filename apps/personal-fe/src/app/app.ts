import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';
import {Chat} from "./chat/chat";

@Component({
  imports: [RouterModule, Chat],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.Emulated,
})
export class App {
}
