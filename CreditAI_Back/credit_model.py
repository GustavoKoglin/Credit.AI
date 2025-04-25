#credit_model.py
# -*- coding: utf-8 -*-

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import mysql.connector

# Carregar dados do MySQL
def load_data():
    connection = mysql.connector.connect(
        host='localhost',
        database='creditaidb',
        user='seu_usuario',
        password='sua_senha'
    )
    
    query = """
        SELECT 
            score, 
            possui_restricoes, 
            atrasos_30_dias,
            atrasos_60_dias,
            atrasos_90_dias,
            renda_mensal,
            CASE WHEN score >= 400 AND possui_restricoes = 0 THEN 1 ELSE 0 END as aprovado
        FROM clientes
    """
    
    df = pd.read_sql(query, connection)
    connection.close()
    return df

# Treinar e salvar o modelo
def train_and_save_model():
    data = load_data()
    
    if len(data) < 50:
        print("Dados insuficientes para treinamento. Coletando mais dados...")
        return
    
    X = data.drop('aprovado', axis=1)
    y = data['aprovado']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Avaliar o modelo
    accuracy = model.score(X_test, y_test)
    print(f"Acurácia do modelo: {accuracy:.2f}")
    
    # Salvar o modelo
    joblib.dump(model, 'credit_model.joblib')
    print("Modelo treinado e salvo com sucesso!")

if __name__ == "__main__":
    train_and_save_model()