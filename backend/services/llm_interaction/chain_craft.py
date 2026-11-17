from langchain_core.output_parsers import PydanticOutputParser
from prompt_building import build_prompt
from parameters_validation import MatchAnalysis

def build_chain(llm, task="match-analysis"):
    parser = PydanticOutputParser(pydantic_object=MatchAnalysis)
    prompt = build_prompt(parser, task=task)
    return prompt | llm | parser