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

  adicionarCliente(cliente: Cliente): Observable<any> {
    // Ajusta os nomes dos campos para corresponder ao backend
    const clienteParaBackend = {
      cpf: cliente.cpf,
      nome: cliente.nome,
      score: cliente.score,
      possui_restricoes: cliente.possuiRestricoesSPC,
      renda_mensal: cliente.rendaMensal,
      historico_pagamentos: {
        percentual_em_dia: cliente.historicoPagamentos.percentualEmDia,
        atrasos_30_dias: cliente.historicoPagamentos.atrasos30Dias,
        atrasos_60_dias: cliente.historicoPagamentos.atrasos60Dias,
        atrasos_90_dias: cliente.historicoPagamentos.atrasos90Dias
      }
    };
    
    return this.http.post(`${this.apiUrl}/clientes`, clienteParaBackend);
  }

  analisarCredito(cpf: string): Observable<ResultadoAnalise> {
    return this.http.post<ResultadoAnalise>(`${this.apiUrl}/analisar`, { cpf });
  }

  listarClientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/clientes`);
  }
}