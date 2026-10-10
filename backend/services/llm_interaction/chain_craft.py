from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from prompt_building import build_prompt
from parameters_validation import MatchReport



def build_chain (report: MatchReport, role: str, llm):
    prompt = ChatPromptTemplate(build_prompt(report, role))
    parser = StrOutputParser()
    return prompt | llm | parser