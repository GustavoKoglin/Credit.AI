import { Component, Input } from '@angular/core';
import { ResultadoAnalise } from '../../models/cliente.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
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
  constructor(private router: Router) {
    this.resultado = this.router.getCurrentNavigation()?.extras.state?.['resultado'];
    
    if (!this.resultado) {
      this.router.navigate(['/analise-credito']);
    }
  }
  @Input() resultado?: ResultadoAnalise;
}
