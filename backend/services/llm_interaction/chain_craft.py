from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from prompt_building import build_prompt

prompt = ChatPromptTemplate(build_prompt())
parser = StrOutputParser()

def build_chain (llm):
    return prompt | llm | parser