from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
from pathlib import Path

app = FastAPI()

# Configura CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class Cliente(BaseModel):
    cpf: str
    nome: str
    score: int
    restricoes: bool
    historicoPagamentos: dict
    rendaMensal: float

class AnaliseRequest(BaseModel):
    cpf: str

# Caminho para o arquivo JSON
DATA_FILE = Path("data/clientes.json")

@app.on_event("startup")
def carregar_dados():
    if not DATA_FILE.exists():
        DATA_FILE.parent.mkdir(exist_ok=True)
        with open(DATA_FILE, "w") as f:
            json.dump({"clientes": []}, f)

@app.get("/clientes")
def listar_clientes():
    with open(DATA_FILE) as f:
        return json.load(f)

@app.post("/clientes")
def adicionar_cliente(cliente: Cliente):
    data = json.loads(DATA_FILE.read_text())
    data["clientes"].append(cliente.dict())
    DATA_FILE.write_text(json.dumps(data, indent=2))
    return {"message": "Cliente adicionado com sucesso"}

@app.post("/analisar")
def analisar_credito(request: AnaliseRequest):
    with open(DATA_FILE) as f:
        data = json.load(f)
    
    cliente = next((c for c in data["clientes"] if c["cpf"] == request.cpf), None)
    
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Lógica de análise (similar ao serviço Angular)
    score = cliente["score"]
    restricoes = cliente["restricoes"]
    historico = cliente["historicoPagamentos"]
    
    motivos = []
    if score < 400: motivos.append("Score baixo")
    if restricoes: motivos.append("Restrições no SPC/Serasa")
    if historico["percentualEmDia"] < 0.7: motivos.append("Histórico de pagamentos insuficiente")
    
    aprovado = len(motivos) == 0
    limite = calcular_limite(score, cliente["rendaMensal"]) if aprovado else 0
    
    return {
        "aprovado": aprovado,
        "limite": limite,
        "motivos": motivos,
        "cliente": cliente
    }

def calcular_limite(score: int, renda: float) -> float:
    return round((renda * 0.5) * (score / 1000))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)