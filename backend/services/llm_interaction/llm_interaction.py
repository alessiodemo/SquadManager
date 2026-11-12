from LLMClient import LLMClient

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

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

def get_embeddings():
    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise RuntimeError("API KEY is required for creating embeddings")

    return OpenAIEmbeddings(
        model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
    )


    