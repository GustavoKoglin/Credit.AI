import { Component, EventEmitter, Output } from '@angular/core';
import { Cliente } from '../../models/cliente.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgxMaskDirective,
  ],
  templateUrl: './formulario.component.html',
  styleUrl: './formulario.component.scss'
})
export class FormularioComponent {

  constructor(private router: Router) {}

  @Output() analisar = new EventEmitter<Cliente>();

  cliente: Cliente & { pagamentosEmDia: boolean } = {
    nome: '',
    cpf: '',
    score: 0,
    possuiRestricoesSPC: false,
    rendaMensal: 0,
    pagamentosEmDia: false,
    historicoPagamentos: {
      percentualEmDia: 1.0,
      atrasos30Dias: 0,
      atrasos60Dias: 0,
      atrasos90Dias: 0
    },
    solicitacao: {
      tipo: 'liberacao',
    }
  };

  onPagamentoChange() {
    if (this.cliente.pagamentosEmDia) {
      this.cliente.historicoPagamentos.atrasos30Dias = 0;
      this.cliente.historicoPagamentos.atrasos60Dias = 0;
      this.cliente.historicoPagamentos.atrasos90Dias = 0;
      this.cliente.historicoPagamentos.percentualEmDia = 1.0;
    } else {
      this.cliente.historicoPagamentos.percentualEmDia = 0.5; // ou algum valor default
    }
  }

  onSubmit() {
    // Remover campo auxiliar antes de emitir
    const clienteCopia: Cliente = {
      nome: this.cliente.nome,
      cpf: this.cliente.cpf,
      score: this.cliente.score,
      possuiRestricoesSPC: this.cliente.possuiRestricoesSPC,
      rendaMensal: this.cliente.rendaMensal,
      historicoPagamentos: {
        percentualEmDia: this.cliente.historicoPagamentos.percentualEmDia,
        atrasos30Dias: this.cliente.historicoPagamentos.atrasos30Dias,
        atrasos60Dias: this.cliente.historicoPagamentos.atrasos60Dias,
        atrasos90Dias: this.cliente.historicoPagamentos.atrasos90Dias
      },
      solicitacao: {
        tipo: this.cliente.solicitacao.tipo,
        valorSolicitado: this.cliente.solicitacao.valorSolicitado
      }
    };

    this.analisar.emit(clienteCopia);
  }
}
