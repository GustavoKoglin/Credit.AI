import { Component } from '@angular/core';
import { ResultadoAnalise } from '../../models/cliente.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './resultado.component.html',
  styleUrl: './resultado.component.scss'
})
export class ResultadoComponent {
  resultado: ResultadoAnalise;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    this.resultado = navigation?.extras.state?.['resultado'];
    
    if (!this.resultado) {
      this.router.navigate(['/analise-credito']);
    }
  }

  formatarMoeda(valor: number | undefined): string {
    if (valor === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  voltarParaAnalise() {
    this.router.navigate(['/analise-credito']);
  }
}



