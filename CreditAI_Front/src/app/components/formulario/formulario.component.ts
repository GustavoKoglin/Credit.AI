import { Component } from '@angular/core';
import { Cliente } from '../../models/cliente.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { ApiService } from '../../services/api.service';
import { ResultadoAnalise } from '../../models/cliente.model';

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
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private apiService: ApiService
  ) { }

  cliente: Cliente & { pagamentosEmDia: boolean } = {
    nome: '',
    cpf: '',
    score: 0,
    possuiRestricoesSPC: false,
    rendaMensal: 0,
    pagamentosEmDia: false,
    historicoPagamentos: {
      atrasos30Dias: 0,
      atrasos60Dias: 0,
      atrasos90Dias: 0
    },
    solicitacao: {
      tipo: 'liberacao',
      valorSolicitado: 0
    }
  };

  onPagamentoChange() {
    if (this.cliente.pagamentosEmDia) {
      this.cliente.historicoPagamentos = this.cliente.historicoPagamentos || {
        atrasos30Dias: 0,
        atrasos60Dias: 0,
        atrasos90Dias: 0
      };
      this.cliente.historicoPagamentos.atrasos30Dias = 0;
      this.cliente.historicoPagamentos.atrasos60Dias = 0;
      this.cliente.historicoPagamentos.atrasos90Dias = 0;
    }
  }

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';

    // Garante que o histórico de pagamentos existe
    if (!this.cliente.historicoPagamentos) {
      this.cliente.historicoPagamentos = {
        atrasos30Dias: 0,
        atrasos60Dias: 0,
        atrasos90Dias: 0
      };
    }

    const clienteParaEnviar = {
      nome: this.cliente.nome,
      cpf: this.cliente.cpf.replace(/\D/g, ''),
      score: Number(this.cliente.score),
      possuiRestricoesSPC: Boolean(this.cliente.possuiRestricoesSPC),
      rendaMensal: Number(this.cliente.rendaMensal),
      historicoPagamentos: {
        atrasos30Dias: Number(this.cliente.historicoPagamentos.atrasos30Dias) || 0,
        atrasos60Dias: Number(this.cliente.historicoPagamentos.atrasos60Dias) || 0,
        atrasos90Dias: Number(this.cliente.historicoPagamentos.atrasos90Dias) || 0
      }
    };

    // Primeiro cadastra o cliente
    this.apiService.adicionarCliente(clienteParaEnviar).subscribe({
      next: () => {
        // Depois faz a análise de crédito
        this.apiService.analisarCredito(this.cliente.cpf.replace(/\D/g, '')).subscribe({
          next: (resultado: ResultadoAnalise) => {
            this.loading = false;
            this.router.navigate(['/resultado'], {
              state: { resultado }
            });
          },
          error: (err) => {
            this.loading = false;
            this.errorMessage = 'Erro ao analisar crédito: ' + (err.error?.message || err.message);
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Erro ao cadastrar cliente: ' + (err.error?.message || err.message);
      }
    });
  }
}