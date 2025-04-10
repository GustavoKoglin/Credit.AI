export interface Cliente {
    nome: string;
    cpf: string;
    score: number;
    possuiRestricoesSPC: boolean;
    historicoPagamentos: {
      percentualEmDia: number;  // 0.0 a 1.0
      atrasos30Dias: number;    // Nº de atrasos
      atrasos60Dias: number;
      atrasos90Dias: number;
    };
    rendaMensal: number;
    solicitacao: {
      tipo: 'liberacao' | 'aumento';
      valorSolicitado?: number;  // Opcional se for aumento
    };
  }
  
  export interface ResultadoAnalise {
    aprovado: boolean;
    limiteAprovado?: number;
    motivosNegacao: string[];  // Ex: ["Score baixo", "Restrições SPC"]
    sugestoes: string[];       // Ex: ["Regularize seu nome", "Aumente seu score"]
  }