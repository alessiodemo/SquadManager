from chain_craft import build_chain
from llm_interaction import get_llm, llm_run
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from parameters_validation import ServiceRequest 
from fastapi import FastAPI

app = FastAPI()

@app.post("/api/service")
def run_service(data: ServiceRequest):
    result = service(data.raw, data.role)
    return {"result": result}

def service(raw: str, role: str):
    llm = FakeListChatModel(responses=["[FAKE] risposta di prova"])
    # llm = get_llm()
    chain = build_chain(raw, role, llm)
    result = llm_run(raw, role, chain)
    return result.content



