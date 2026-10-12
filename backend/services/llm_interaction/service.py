from LLMClient import LangChainClient
from chain_craft import build_chain
from llm_interaction import get_llm
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from parameters_validation import ServiceRequest 
from fastapi import FastAPI, HTTPException

app = FastAPI()

#llm = FakeListChatModel(responses=["[FAKE] risposta di prova"])
llm = get_llm()
chain = build_chain(llm)
client = LangChainClient(chain)

@app.post("/api/service")
def run_service(data: ServiceRequest):
    try:
        result = client.generate_report(data.raw, data.role)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return {"result": result}



