# -*- coding: utf-8 -*-
"""
Módulo principal da API Credit.AI - Sistema de análise de crédito
"""

# Importações necessárias
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException  # Framework para criar a API
from fastapi.middleware.cors import CORSMiddleware  # Para lidar com CORS
from pydantic import BaseModel, Field, validator  # Para validação de dados
import mysql.connector  # Conector MySQL
from mysql.connector import Error  # Para tratamento de erros do MySQL
import joblib  # Para salvar/carregar modelos de ML
import numpy as np  # Para cálculos numéricos
from sklearn.ensemble import RandomForestClassifier  # Algoritmo de ML
from pathlib import Path  # Para manipulação de caminhos de arquivos
from typing import Dict, Optional
import os

load_dotenv()  # Carrega as variáveis do arquivo .env

# Inicializa a aplicação FastAPI
app = FastAPI(
    title="Credit.AI API",
    description="API para análise de crédito utilizando machine learning",
    version="1.0.0"
)

# Configuração do CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================
# MODELOS PYDANTIC PARA VALIDAÇÃO DE DADOS
# ==============================================

class HistoricoPagamentos(BaseModel):
    percentualEmDia: float = Field(..., ge=0, le=1, alias="percentualEmDia")
    atrasos30Dias: int = Field(..., ge=0, alias="atrasos30Dias")
    atrasos60Dias: int = Field(..., ge=0, alias="atrasos60Dias")
    atrasos90Dias: int = Field(..., ge=0, alias="atrasos90Dias")
    
    class Config:
        allow_population_by_field_name = True

class Cliente(BaseModel):
    cpf: str = Field(..., min_length=11, max_length=14, alias="cpf")
    nome: str = Field(..., min_length=3, alias="nome")
    score: int = Field(..., ge=300, le=1000, alias="score")
    possuiRestricoes: bool = Field(..., alias="possuiRestricoes")
    historicoPagamentos: HistoricoPagamentos = Field(..., alias="historicoPagamentos")
    rendaMensal: float = Field(..., gt=0, alias="rendaMensal")

    @validator('cpf')
    def cpf_deve_ter_11_numeros(cls, v):
        numbers = [c for c in v if c.isdigit()]
        if len(numbers) != 11:
            raise ValueError('CPF deve conter 11 dígitos')
        return v

    class Config:
        allow_population_by_field_name = True

class AnaliseRequest(BaseModel):
    cpf: str = Field(..., min_length=11, max_length=14)

# ==============================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ==============================================

def get_db_connection():
    """Estabelece conexão com o banco de dados MySQL usando variáveis do .env"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),         
            database=os.getenv("DB_NAME"),     
            user=os.getenv("DB_USER"),         
            password=os.getenv("DB_PASSWORD"), 
            port=os.getenv("DB_PORT")          
        )
        return connection
    except Error as e:
        print(f"Erro ao conectar ao MySQL: {e}")
        return None

# ==============================================
# CONFIGURAÇÃO DO MODELO DE MACHINE LEARNING
# ==============================================

MODEL_FILE = 'credit_model.joblib'

def inicializar_modelo():
    """Inicializa ou carrega o modelo de machine learning"""
    if not Path(MODEL_FILE).exists():
        print("Criando modelo básico de crédito...")
        
        X_train = np.array([
            [800, 0, 0.95, 0, 0, 0, 5000],
            [300, 1, 0.60, 5, 3, 2, 1500],
            [650, 0, 0.85, 2, 0, 0, 3500],
            [450, 1, 0.70, 3, 1, 0, 2500],
            [720, 0, 0.92, 1, 0, 0, 4500]
        ])
        
        y_train = np.array([1, 0, 1, 0, 1])
        
        model = RandomForestClassifier(n_estimators=50, random_state=42)
        model.fit(X_train, y_train)
        
        joblib.dump(model, MODEL_FILE)
        print(f"Modelo básico salvo em {MODEL_FILE}")
        return model
    
    try:
        model = joblib.load(MODEL_FILE)
        print("Modelo de crédito carregado com sucesso!")
        return model
    except Exception as e:
        print(f"Erro ao carregar modelo: {e}")
        return None

credit_model = inicializar_modelo()

# ==============================================
# FUNÇÕES AUXILIARES
# ==============================================

def calcular_limite(score: int, renda: float) -> float:
    """Calcula o limite de crédito com base no score e renda"""
    return round((renda * 0.5) * (score / 1000))

def formatar_cliente_db(cliente_db: Dict) -> Dict:
    """Formata os dados do cliente do banco para o frontend"""
    return {
        "cpf": cliente_db['cpf'],
        "nome": cliente_db['nome'],
        "score": cliente_db['score'],
        "possuiRestricoes": cliente_db['possui_restricoes'],
        "rendaMensal": cliente_db['renda_mensal'],
        "historicoPagamentos": {
            'percentualEmDia': cliente_db['percentual_pagamentos_em_dia'],
            'atrasos30Dias': cliente_db['atrasos_30_dias'],
            'atrasos60Dias': cliente_db['atrasos_60_dias'],
            'atrasos90Dias': cliente_db['atrasos_90_dias']
        }
    }

# ==============================================
# ROTAS DA API
# ==============================================

@app.get("/")
def read_root():
    return {
        "message": "Credit.AI API está rodando",
        "endpoints": {
            "docs": "/docs",
            "clientes": "/clientes",
            "analise": "/analisar"
        }
    }

@app.get("/clientes")
def listar_clientes():
    connection = get_db_connection()
    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Erro de conexão com o banco de dados"
        )
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM clientes")
        clientes = cursor.fetchall()
        return {"clientes": [formatar_cliente_db(cliente) for cliente in clientes]}
    except Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao consultar clientes: {e}"
        )
    finally:
        if connection:
            connection.close()

@app.post("/clientes")
def adicionar_cliente(cliente: Cliente):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Erro de conexão com o banco de dados"
        )
    
    try:
        cursor = connection.cursor()
        query = """
        INSERT INTO clientes (
            cpf, nome, score, possui_restricoes, renda_mensal,
            percentual_pagamentos_em_dia, atrasos_30_dias, 
            atrasos_60_dias, atrasos_90_dias
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            cliente.cpf,
            cliente.nome,
            cliente.score,
            cliente.possui_restricoes,
            cliente.renda_mensal,
            cliente.historico_pagamentos.percentualEmDia,
            cliente.historico_pagamentos.atrasos30Dias,
            cliente.historico_pagamentos.atrasos60Dias,
            cliente.historico_pagamentos.atrasos90Dias
        )
        
        cursor.execute(query, values)
        connection.commit()
        return {"message": "Cliente adicionado com sucesso"}
    except Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao adicionar cliente: {e}"
        )
    finally:
        if connection:
            connection.close()

@app.post("/analisar")
def analisar_credito(request: AnaliseRequest):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Erro de conexão com o banco de dados"
        )
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM clientes WHERE cpf = %s", (request.cpf,))
        cliente_db = cursor.fetchone()
        
        if not cliente_db:
            raise HTTPException(
                status_code=404,
                detail="Cliente não encontrado"
            )
        
        # Prepara dados para análise
        input_data = np.array([
            cliente_db['score'],
            cliente_db['possui_restricoes'],
            cliente_db['percentual_pagamentos_em_dia'],
            cliente_db['atrasos_30_dias'],
            cliente_db['atrasos_60_dias'],
            cliente_db['atrasos_90_dias'],
            cliente_db['renda_mensal']
        ]).reshape(1, -1)
        
        # Realiza a análise
        if credit_model:
            aprovado = credit_model.predict(input_data)[0]
            probabilidade = credit_model.predict_proba(input_data)[0][1]
            motivos = [] if aprovado else ["Análise pelo modelo de machine learning"]
        else:
            motivos = []
            if cliente_db['score'] < 400: 
                motivos.append("Score baixo (mínimo: 400)")
            if cliente_db['possui_restricoes']: 
                motivos.append("Restrições no SPC/Serasa")
            if cliente_db['percentual_pagamentos_em_dia'] < 0.7: 
                motivos.append("Histórico de pagamentos insuficiente (mínimo: 70%)")
            aprovado = len(motivos) == 0
            probabilidade = 1.0 if aprovado else 0.0
        
        limite = calcular_limite(cliente_db['score'], cliente_db['renda_mensal']) if aprovado else 0
        
        return {
            "aprovado": bool(aprovado),
            "probabilidade": float(probabilidade),
            "limite": limite,
            "motivos": motivos,
            "cliente": formatar_cliente_db(cliente_db)
        }
    except Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao acessar banco de dados: {e}"
        )
    finally:
        if connection:
            connection.close()

# Ponto de entrada da aplicação
if __name__ == "__main__":
    conn = get_db_connection()
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)