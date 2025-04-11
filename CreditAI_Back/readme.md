# Credit.AI - Sistema de Análise de Crédito

![Credit.AI Logo](favicon.ico)

## 📂 Estrutura do Projeto
```
CREDIT.AI/
├── xscode/                   # Configurações do VS Code
├── CreditAI_Back/            # Pasta principal do backend
│   ├── __pycache__/          # Cache Python
│   ├── data/                 # Dados do projeto
│   ├── venv/                 # Ambiente virtual Python
│   ├── carregar_dados.py     # Script para carregar dados
│   ├── credit_model.joblib   # Modelo treinado
│   ├── credit_model.py       # Código do modelo
│   ├── favicon.ico           # Ícone
│   ├── main.py               # Aplicação FastAPI
│   ├── README.md             # Este arquivo
│   └── requirements.txt      # Dependências
```

## 🚀 Instalação Rápida

1. Clone o repositório
2. Configure o ambiente:
```bash
cd CREDIT.AI/CreditAI_Back
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate no Windows
pip install -r requirements.txt
```

3. Configure o MySQL:
```sql
CREATE DATABASE creditaidb;
USE creditaidb;
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    possui_restricoes BOOLEAN NOT NULL,
    renda_mensal DECIMAL(10,2) NOT NULL,
    percentual_pagamentos_em_dia DECIMAL(3,2) NOT NULL,
    atrasos_30_dias INT NOT NULL,
    atrasos_60_dias INT NOT NULL,
    atrasos_90_dias INT NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. Inicie o servidor:
```bash
uvicorn main:app --reload
```

## 🔍 Documentação da API

Acesse a documentação interativa em: [http://localhost:8000/docs](http://localhost:8000/docs)

### Principais Endpoints:

**POST /clientes** - Cadastra novo cliente
```json
{
  "cpf": "123.456.789-09",
  "nome": "Fulano Silva",
  "score": 750,
  "possui_restricoes": false,
  "historico_pagamentos": {
    "percentualEmDia": 0.95,
    "atrasos30Dias": 1,
    "atrasos60Dias": 0,
    "atrasos90Dias": 0
  },
  "renda_mensal": 3500.00
}
```

**POST /analisar** - Analisa crédito
```json
{"cpf": "123.456.789-09"}
```

## 🤖 Modelo de Machine Learning

- Algoritmo: Random Forest
- Features:
  - Score (300-1000)
  - Restrições (SPC/Serasa)
  - Histórico de pagamentos
  - Renda mensal

Para retreinar o modelo:
```bash
rm credit_model.joblib
python credit_model.py
```

## ⚠️ Solução de Problemas

**Erro de conexão com MySQL:**
- Verifique se o serviço está rodando
- Confira as credenciais no código

**Problemas nas dependências:**
```bash
pip install --upgrade -r requirements.txt
```

## 📄 Licença

MIT License - Disponível em LICENSE