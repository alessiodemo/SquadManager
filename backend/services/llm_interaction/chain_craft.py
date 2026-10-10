from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from prompt_building import build_prompt
from parameters_validation import MatchReport

def build_chain (llm):
    return build_prompt() | llm | StrOutputParser()