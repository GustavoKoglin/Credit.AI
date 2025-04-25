export interface Cliente {
  nome: string;
  cpf: string;
  score: number;
  possuiRestricoesSPC: boolean;
  historicoPagamentos: {
    atrasos30Dias: number;
    atrasos60Dias: number;
    atrasos90Dias: number;
  };
  rendaMensal: number;
  solicitacao: {
    tipo: 'liberacao' | 'aumento';
    valorSolicitado?: number;
  };
}

export interface ResultadoAnalise {
  aprovado: boolean;
  limiteAprovado?: number;
  motivosNegacao: string[];  // Ex: ["Score baixo", "Restrições SPC"]
  sugestoes: string[];       // Ex: ["Regularize seu nome", "Aumente seu score"]
}