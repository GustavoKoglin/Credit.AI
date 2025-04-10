import { Injectable } from '@angular/core';
import { Cliente, ResultadoAnalise } from '../models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class CreditoService {
  analisar(cliente: Cliente): ResultadoAnalise {
    const motivos: string[] = [];
    const sugestoes: string[] = [];

    // Regras de negócio (exemplo)
    if (cliente.score < 400) {
      motivos.push('Score muito baixo (mínimo: 400)');
      sugestoes.push('Melhore seu score pagando contas em dia');
    }
    if (cliente.possuiRestricoesSPC) {
      motivos.push('Restrições no SPC/Serasa');
      sugestoes.push('Regularize seu nome para liberação');
    }
    if (cliente.historicoPagamentos.percentualEmDia < 0.7) {
      motivos.push('Histórico de pagamentos insuficiente');
      sugestoes.push('Aumente para 70% de pagamentos em dia');
    }

    const aprovado = motivos.length === 0;
    return {
      aprovado,
      limiteAprovado: aprovado ? this.calcularLimite(cliente) : undefined,
      motivosNegacao: motivos,
      sugestoes,
    };
  }

  private calcularLimite(cliente: Cliente): number {
    // Lógica personalizada (exemplo)
    const base = cliente.rendaMensal * 0.5;
    const multiplicador = cliente.score / 1000;
    return Math.round(base * multiplicador);
  }
}