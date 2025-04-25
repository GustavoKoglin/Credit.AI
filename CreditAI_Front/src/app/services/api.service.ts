// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente.model';
import { ResultadoAnalise } from '../models/cliente.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl; // Configurado no environment.ts

  constructor(private http: HttpClient) { }

  

  adicionarCliente(cliente: any): Observable<any> {
    // Validação dos dados antes de enviar
    if (!cliente.historicoPagamentos) {
      throw new Error('Histórico de pagamentos é obrigatório');
    }
  
    // Prepara o objeto no formato que o backend espera
    const dadosParaBackend = {
      cpf: cliente.cpf.replace(/\D/g, ''), // Remove formatação do CPF
      nome: cliente.nome,
      score: Number(cliente.score), // Garante que é número
      possui_restricoes: Boolean(cliente.possuiRestricoesSPC), // Converte para boolean
      renda_mensal: Number(cliente.rendaMensal), // Garante que é número
      historico_pagamentos: {
        atrasos_30_dias: Number(cliente.historicoPagamentos.atrasos30Dias) || 0,
        atrasos_60_dias: Number(cliente.historicoPagamentos.atrasos60Dias) || 0,
        atrasos_90_dias: Number(cliente.historicoPagamentos.atrasos90Dias) || 0
      }
    };
  
    console.log('Dados sendo enviados:', JSON.stringify(dadosParaBackend, null, 2));
    return this.http.post(`${this.apiUrl}/clientes`, dadosParaBackend, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Nova função para buscar cliente por CPF
  getClientePorCpf(cpf: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/clientes/${cpf}`);
  }

  analisarCredito(cpf: string): Observable<ResultadoAnalise> {
    return this.http.post<ResultadoAnalise>(`${this.apiUrl}analise-credito`, { cpf });
  }

  listarClientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/clientes`);
  }
}