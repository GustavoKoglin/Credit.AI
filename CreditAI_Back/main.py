# -*- coding: utf-8 -*-
"""
Módulo principal da API Credit.AI - Sistema de análise de crédito
Versão Corrigida
"""

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import mysql.connector
from mysql.connector import Error
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from pathlib import Path
from typing import Dict, List, Optional
import os
import logging
from fastapi import status

# Configuração básica de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Inicialização da aplicação
app = FastAPI(
    title="Credit.AI | API",
    description="API para análise de crédito utilizando machine learning",
    version="2.0.0",
    docs_url="/docs",
    redoc_url=None
)

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ==============================================
# MODELOS PYDANTIC
# ==============================================

class HistoricoPagamentos(BaseModel):
    """Modelo para histórico de pagamentos do cliente"""
    atrasos_30_dias: int = Field(
        default=0,
        ge=0,
        alias="atrasos30Dias",
        description="Quantidade de atrasos entre 1-30 dias"
    )
    atrasos_60_dias: int = Field(
        default=0,
        ge=0,
        alias="atrasos60Dias", 
        description="Quantidade de atrasos entre 31-60 dias"
    )
    atrasos_90_dias: int = Field(
        default=0,
        ge=0,
        alias="atrasos90Dias",
        description="Quantidade de atrasos acima de 60 dias"
    )
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "atrasos30Dias": 1,
                "atrasos60Dias": 0,
                "atrasos90Dias": 0
            }
        }
    }

class Cliente(BaseModel):
    """Modelo principal para dados do cliente"""
    cpf: str = Field(
        ...,
        min_length=11,
        max_length=11,
        pattern=r'^\d+$',
        alias="cpf",
        description="CPF do cliente (apenas números)"
    )
    nome: str = Field(
        ...,
        min_length=3,
        max_length=100,
        alias="nome",
        description="Nome completo do cliente"
    )
    score: int = Field(
        ...,
        ge=300,
        le=1000,
        alias="score",
        description="Score de crédito (300-1000)"
    )
    possui_restricoes: bool = Field(
        ...,
        alias="possuiRestricoes",
        description="Indica se possui restrições no SPC/Serasa"
    )
    renda_mensal: float = Field(
        ...,
        gt=0,
        alias="rendaMensal",
        description="Renda mensal em reais (maior que zero)"
    )
    historico_pagamentos: HistoricoPagamentos = Field(
        ...,
        alias="historicoPagamentos",
        description="Histórico de pagamentos do cliente"
    )

    @validator('cpf')
    def cpf_deve_ter_11_numeros(cls, v):
        if not v.isdigit() or len(v) != 11:
            raise ValueError('CPF deve conter exatamente 11 dígitos numéricos')
        return v

    @validator('renda_mensal')
    def arredondar_renda(cls, v):
        return round(v, 2)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "cpf": "12345678901",
                "nome": "Fulano de Tal",
                "score": 700,
                "possuiRestricoes": False,
                "rendaMensal": 5000.50,
                "historicoPagamentos": {
                    "atrasos30Dias": 1,
                    "atrasos60Dias": 0,
                    "atrasos90Dias": 0
                }
            }
        }
    }

class AnaliseRequest(BaseModel):
    """Modelo para requisição de análise de crédito"""
    cpf: str = Field(
        ...,
        min_length=11,
        max_length=11,
        pattern=r'^\d+$',
        description="CPF do cliente a ser analisado (apenas números)"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "cpf": "12345678901"
            }
        }
    }

class AnaliseResponse(BaseModel):
    """Modelo para resposta da análise de crédito"""
    aprovado: bool
    limite: float
    probabilidade: float
    motivos: List[str]
    cliente: Cliente
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "aprovado": True,
                "limite": 12500.00,
                "probabilidade": 0.95,
                "motivos": [],
                "cliente": {
                    "cpf": "12345678901",
                    "nome": "Fulano de Tal",
                    "score": 700,
                    "possuiRestricoes": False,
                    "rendaMensal": 5000.50,
                    "historicoPagamentos": {
                        "atrasos30Dias": 1,
                        "atrasos60Dias": 0,
                        "atrasos90Dias": 0
                    }
                }
            }
        }
    }

# ==============================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ==============================================

def get_db_connection():
    """Estabelece conexão com o banco de dados MySQL"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "credito_db"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            port=os.getenv("DB_PORT", 3306)
        )
        logger.info("Conexão com o banco de dados estabelecida")
        return connection
    except Error as e:
        logger.error(f"Erro ao conectar ao MySQL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro de conexão com o banco de dados"
        )

# ==============================================
# MODELO DE MACHINE LEARNING (ATUALIZADO)
# ==============================================

MODEL_FILE = 'credit_model.joblib'

def inicializar_modelo() -> Optional[RandomForestClassifier]:
    """Inicializa ou carrega o modelo de machine learning"""
    try:
        if not Path(MODEL_FILE).exists():
            logger.info("Criando modelo básico de crédito...")
            
            # Dados de treinamento de exemplo (sem o parâmetro de porcentagem removido)
            X_train = np.array([
                [800, 0, 0, 0, 0, 5000],    # Removido o terceiro parâmetro (porcentagem)
                [300, 1, 5, 3, 2, 1500],
                [650, 0, 2, 0, 0, 3500],
                [450, 1, 3, 1, 0, 2500],
                [720, 0, 1, 0, 0, 4500]
            ])
            
            y_train = np.array([1, 0, 1, 0, 1])  # 1 = Aprovado, 0 = Reprovado
            
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            model.fit(X_train, y_train)
            
            joblib.dump(model, MODEL_FILE)
            logger.info(f"Modelo básico salvo em {MODEL_FILE}")
            return model
        
        model = joblib.load(MODEL_FILE)
        logger.info("Modelo de crédito carregado com sucesso!")
        return model
    except Exception as e:
        logger.error(f"Erro ao carregar modelo: {e}")
        return None

credit_model = inicializar_modelo()

# ==============================================
# FUNÇÕES AUXILIARES
# ==============================================

def calcular_limite(score: int, renda: float) -> float:
    """Calcula o limite de crédito com base no score e renda"""
    limite_base = renda * 0.5  # Até 50% da renda
    fator_score = score / 1000  # Fator de 0.3 a 1.0
    return round(limite_base * fator_score, 2)

def formatar_cliente_db(cliente_db: Dict) -> Dict:
    """Formata os dados do cliente do banco para o frontend"""
    return {
        "cpf": cliente_db['cpf'],
        "nome": cliente_db['nome'],
        "score": cliente_db['score'],
        "possuiRestricoes": cliente_db['possui_restricoes'],
        "rendaMensal": cliente_db['renda_mensal'],
        "historicoPagamentos": {
            'atrasos30Dias': cliente_db['atrasos_30_dias'],
            'atrasos60Dias': cliente_db['atrasos_60_dias'],
            'atrasos90Dias': cliente_db['atrasos_90_dias']
        }
    }

# ==============================================
# ROTAS DA API (ATUALIZADAS PARA O NOVO MODELO)
# ==============================================

@app.get("/", tags=["Root"])
async def root():
    """Endpoint raiz que retorna informações básicas da API"""
    return {
        "message": "Credit.AI API está rodando",
        "version": app.version,
        "endpoints": {
            "documentação": "/docs",
            "listar_clientes": "/clientes",
            "analise_credito": "/analise-credito"
        }
    }

@app.post("/clientes", status_code=status.HTTP_201_CREATED, tags=["Clientes"])
async def adicionar_cliente(cliente: Cliente):
    """Adiciona um novo cliente ao sistema"""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Verifica se CPF já existe
        cursor.execute("SELECT 1 FROM clientes WHERE cpf = %s", (cliente.cpf,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CPF {cliente.cpf} já cadastrado"
            )
        
        # Se não existir, procede com inserção
        cursor = connection.cursor()
        query = """
        INSERT INTO clientes (
            cpf, nome, score, possui_restricoes, renda_mensal,
            atrasos_30_dias, atrasos_60_dias, atrasos_90_dias
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            cliente.cpf,
            cliente.nome,
            cliente.score,
            cliente.possui_restricoes,
            cliente.renda_mensal,
            cliente.historico_pagamentos.atrasos_30_dias,
            cliente.historico_pagamentos.atrasos_60_dias,
            cliente.historico_pagamentos.atrasos_90_dias 
        )
        
        cursor.execute(query, values)
        connection.commit()
        
        return {
            "message": "Cliente adicionado com sucesso",
            "cpf": cliente.cpf,
            "nome": cliente.nome
        }
        
    except Error as e:
        if connection:
            connection.rollback()
        
        # Tratamento específico para erro de duplicidade
        if e.errno == 1062:  # MySQL error code for duplicate entry
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CPF {cliente.cpf} já está cadastrado no sistema"
            )
        
        logger.error(f"Erro ao adicionar cliente: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao cadastrar cliente: {str(e)}"
        )
        
    finally:
        if connection and connection.is_connected():
            connection.close()

@app.get("/clientes", response_model=Dict[str, List[Cliente]], tags=["Clientes"])
async def listar_clientes(nome: Optional[str] = None, cpf: Optional[str] = None):
    """Retorna lista de clientes com filtros opcionais"""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM clientes"
        params = []
        
        # Adiciona filtros se fornecidos
        filters = []
        if nome:
            filters.append("nome LIKE %s")
            params.append(f"%{nome}%")
        if cpf:
            filters.append("cpf = %s")
            params.append(cpf)
            
        if filters:
            query += " WHERE " + " AND ".join(filters)
            
        cursor.execute(query, tuple(params))
        clientes = cursor.fetchall()
        
        return {
            "clientes": [formatar_cliente_db(cliente) for cliente in clientes],
            "total": len(clientes)
        }
        
    except Error as e:
        logger.error(f"Erro ao consultar clientes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar clientes"
        )
    finally:
        if connection and connection.is_connected():
            connection.close()

@app.get("/analise-credito/{cpf}", response_model=AnaliseResponse, tags=["Análise de Crédito"])
async def analisar_credito_get(cpf: str):
    """Endpoint GET para análise de crédito por CPF"""
    return await analisar_credito(AnaliseRequest(cpf=cpf))

@app.post("/analise-credito", response_model=AnaliseResponse, tags=["Análise de Crédito"])
async def analisar_credito(request: AnaliseRequest):
    """Realiza análise de crédito para um cliente"""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM clientes WHERE cpf = %s", (request.cpf,))
        cliente_db = cursor.fetchone()
        
        if not cliente_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cliente com CPF {request.cpf} não encontrado"
            )
        
        # Prepara dados para análise
        input_data = np.array([
            cliente_db['score'],
            int(cliente_db['possui_restricoes']),
            cliente_db['atrasos_30_dias'],
            cliente_db['atrasos_60_dias'],
            cliente_db['atrasos_90_dias'],
            cliente_db['renda_mensal']
        ]).reshape(1, -1)
        
        # Realiza a análise
        motivos = []
        if credit_model:
            try:
                aprovado = bool(credit_model.predict(input_data)[0])
                probabilidade = float(credit_model.predict_proba(input_data)[0][1])
                
                if not aprovado:
                    motivos.append("Reprovado pelo modelo de análise")
            except Exception as e:
                logger.error(f"Erro no modelo de ML: {str(e)}")
                aprovado = False
                probabilidade = 0.0
                motivos.append("Erro na análise automatizada")
        else:
            logger.warning("Modelo de ML não carregado, usando fallback")
            aprovado = False
            probabilidade = 0.0
            motivos.append("Sistema de análise indisponível")
        
        # Adiciona motivos específicos
        if cliente_db['score'] < 400:
            motivos.append("Score abaixo do mínimo (400)")
        if cliente_db['possui_restricoes']:
            motivos.append("Possui restrições cadastrais")
        if cliente_db['atrasos_90_dias'] > 0:
            motivos.append(f"{cliente_db['atrasos_90_dias']} atrasos graves")
        
        # Se não houver motivos, aprova
        if not motivos:
            aprovado = True
            probabilidade = 0.95 if probabilidade == 0 else probabilidade
        
        limite = calcular_limite(cliente_db['score'], cliente_db['renda_mensal']) if aprovado else 0.0
        
        return AnaliseResponse(
            aprovado=aprovado,
            limite=limite,
            probabilidade=probabilidade,
            motivos=motivos,
            cliente=formatar_cliente_db(cliente_db)
        )
        
    except Error as e:
        logger.error(f"Erro no banco de dados: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar análise"
        )
    except Exception as e:
        logger.error(f"Erro inesperado: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno no servidor"
        )
    finally:
        if connection and connection.is_connected():
            connection.close()
            
# Ponto de entrada da aplicação
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)