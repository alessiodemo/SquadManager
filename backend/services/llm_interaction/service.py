from chain_craft import build_chain
from llm_interaction import get_llm, llm_run
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from parameters_validation import ServiceRequest 
from fastapi import FastAPI, HTTPException

app = FastAPI()

llm = FakeListChatModel(responses=["[FAKE] risposta di prova"])
chain = build_chain(llm)

@app.post("/api/service")
def run_service(data: ServiceRequest):
    try:
        result = llm_run(data.raw, data.role, chain)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return {"result": result}



