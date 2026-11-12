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
chain = build_chain(llm)
client = LangChainClient(chain)
embeddings = get_embeddings()

class EmbeddingRequest(BaseModel):
    text: str = Field(min_length=1)

@app.post("/api/service")
def run_service(data: ServiceRequest):
    try:
        result = client.generate_report(data.raw, data.role)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return {"result": result}

@app.post("/api/embeddings")
def create_embedding(data: EmbeddingRequest):
    try:
        return {"embedding": embeddings.embed_query(data.text)}
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Embedding generation failed: {error}") from error


