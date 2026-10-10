from parameters_validation import MatchReport
from pydantic import ValidationError

from LLMClient import LLMClient
from prompt_building import get_data

import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

def get_llm():
    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise RuntimeError("API KEY is required for interacting with LLM")

    return ChatOpenAI(
        model=os.getenv("LLM_PROVIDER"),
        temperature=0.3,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
    )
    
def llm_run(raw: str, role, chain):

    try:
        report = (MatchReport.model_validate_json(raw) if isinstance(raw, str) else MatchReport.model_validate(raw))
    except ValidationError as e:
        raise ValueError(f"Input format not valid: {e}") from e
    
    return chain.invoke({
        "data": json.dumps(get_data(report), ensure_ascii=False, indent=2),
        "task": role
    })


    