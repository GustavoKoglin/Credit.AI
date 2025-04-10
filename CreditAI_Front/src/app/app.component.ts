import { Component } from '@angular/core';
import { Cliente, ResultadoAnalise } from './models/cliente.model';
import { CreditoService } from './services/credito.service';
import { FormularioComponent } from "./components/formulario/formulario.component";
import { ResultadoComponent } from "./components/resultado/resultado.component";
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
],
  template: `
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  resultado?: ResultadoAnalise;

  constructor(private creditoService: CreditoService) {}

  onAnalisar(cliente: Cliente) {
    this.resultado = this.creditoService.analisar(cliente);
  }
}