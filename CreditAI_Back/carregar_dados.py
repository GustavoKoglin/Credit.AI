# carregar_dados.py
import mysql.connector
import json
from pathlib import Path
from collections import Counter

def carregar_clientes():
    try: 
        # 1. Conecta ao banco
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Gbk@2027',
            database='creditaidb',
            port=3306
        )
        cursor = conn.cursor()

        # 2. Carrega dados do JSON
        caminho_json = Path('data/clientes.json')
        with open(caminho_json, 'r', encoding='utf-8') as file:
            dados = json.load(file)

        # Verifica duplicados no JSON
        cpfs = [cli['cpf'] for cli in dados['clientes']]
        duplicados = [cpf for cpf, count in Counter(cpfs).items() if count > 1]
        if duplicados:
            print(f"⚠️ Aviso: CPFs duplicados no arquivo JSON: {duplicados}")

        # 3. Insere cada cliente com tratamento de duplicados
        inseridos = 0
        duplicados_db = 0
        
        for cliente in dados['clientes']:
            try:
                cursor.execute("""
                    INSERT INTO clientes (
                        cpf, nome, score, possui_restricoes, renda_mensal,
                        atrasos_30_dias, atrasos_60_dias, atrasos_90_dias
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        nome = VALUES(nome),
                        score = VALUES(score),
                        possui_restricoes = VALUES(possui_restricoes),
                        renda_mensal = VALUES(renda_mensal),
                        atrasos_30_dias = VALUES(atrasos_30_dias),
                        atrasos_60_dias = VALUES(atrasos_60_dias),
                        atrasos_90_dias = VALUES(atrasos_90_dias)
                """, (
                    cliente['cpf'],
                    cliente['nome'],
                    cliente['score'],
                    cliente['possuiRestricoes'],
                    cliente['rendaMensal'],
                    cliente['historicoPagamentos']['atrasos30Dias'],
                    cliente['historicoPagamentos']['atrasos60Dias'],
                    cliente['historicoPagamentos']['atrasos90Dias']
                ))
                inseridos += 1
            except mysql.connector.Error as err:
                if err.errno == 1062:  # Código do erro de duplicata
                    duplicados_db += 1
                    print(f"⚠️ CPF {cliente['cpf']} já existe no banco. Atualizando registro...")
                else:
                    raise
        
        conn.commit()
        print(f"\n✅ Resultado:")
        print(f"- Total de registros no JSON: {len(dados['clientes'])}")
        print(f"- Registros inseridos: {inseridos}")
        print(f"- Registros atualizados: {duplicados_db}")
    
    except Exception as e:
        print(f"\n❌ Erro grave: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Iniciando carga de clientes...")
    carregar_clientes()
    print("Processo concluído.")