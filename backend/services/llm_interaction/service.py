from LLMClient import LangChainClient
from chain_craft import build_chain
from llm_interaction import get_embeddings, get_llm
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from parameters_validation import ServiceRequest
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException

app = FastAPI()

#llm = FakeListChatModel(responses=["[FAKE] risposta di prova"])
llm = get_llm()
chains = {
    "match-analysis": build_chain(llm, task="match-analysis"),
    "transfer-advice": build_chain(llm, task="transfer-advice")
}
client = LangChainClient(chains)
embeddings = get_embeddings()

class EmbeddingRequest(BaseModel):
    text: str = Field(min_length=1)

@app.get("/health/live")
def liveness():
    return {"status": "ok"}

@app.get("/health/ready")
def readiness():
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM client is unavailable")
    return {"status": "ok", "llm": "configured"}

@app.post("/api/service")
def run_service(data: ServiceRequest):
    try:
        result = client.generate_report(
            data.raw, 
            data.role,
            data.task,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"LLM provider request failed: {error}") from error
    return {"result": result}

@app.post("/api/embeddings")
def create_embedding(data: EmbeddingRequest):
    try:
        return {"embedding": embeddings.embed_query(data.text)}
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Embedding generation failed: {error}") from error


