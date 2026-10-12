from LLMClient import LLMClient

import os
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
        max_tokens=1000,
        base_url="https://openrouter.ai/api/v1",
    )
    


    