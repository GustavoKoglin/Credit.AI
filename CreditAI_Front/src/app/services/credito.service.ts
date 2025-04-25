import { Injectable } from '@angular/core';
import { Cliente, ResultadoAnalise } from '../models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class CreditoService {
  private readonly SCORE_MINIMO = 400;
  private readonly PORCENTAGEM_RENDA = 0.5;

  analisar(cliente: Cliente): ResultadoAnalise {
    const { motivos, sugestoes } = this.avaliarCriticos(cliente);
    const aprovado = motivos.length === 0;

    return {
      aprovado,
      limiteAprovado: aprovado ? this.calcularLimite(cliente) : undefined,
      motivosNegacao: motivos,
      sugestoes,
    };
  }

  private avaliarCriticos(cliente: Cliente): { motivos: string[]; sugestoes: string[] } {
    const motivos: string[] = [];
    const sugestoes: string[] = [];

    // Avaliação de score
    if (cliente.score < this.SCORE_MINIMO) {
      motivos.push(`Score muito baixo (mínimo: ${this.SCORE_MINIMO})`);
      sugestoes.push('Melhore seu score pagando contas em dia');
    }

    // Avaliação de restrições
    if (cliente.possuiRestricoesSPC) {
      motivos.push('Restrições no SPC/Serasa');
      sugestoes.push('Regularize seu nome para liberação');
    }

    // Avaliação de histórico de pagamentos
    const { atrasos30Dias, atrasos60Dias, atrasos90Dias } = cliente.historicoPagamentos;
    if (atrasos30Dias > 2 || atrasos60Dias > 0 || atrasos90Dias > 0) {
      motivos.push('Histórico de pagamentos com atrasos significativos');
      sugestoes.push('Mantenha seus pagamentos em dia para melhorar sua análise');
    }

    return { motivos, sugestoes };
  }

  private calcularLimite(cliente: Cliente): number {
    const base = cliente.rendaMensal * this.PORCENTAGEM_RENDA;
    const multiplicador = cliente.score / 1000; // Normaliza score para 0-1
    return Math.round(base * multiplicador);
  }
}