from langchain_core.output_parsers import PydanticOutputParser
from prompt_building import build_prompt
from parameters_validation import MatchAnalysis

def build_chain(llm):
    parser = PydanticOutputParser(pydantic_object=MatchAnalysis)
    prompt = build_prompt(parser)
    return prompt | llm | parser