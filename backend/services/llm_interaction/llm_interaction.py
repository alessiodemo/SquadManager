from parameters_validation import MatchReport
from pydantic import ValidationError

from backend.services.llm_interaction import LLMClient
from backend.services.llm_interaction.prompt_building import build_prompt


def llm_run(raw: str, role, chain):

    try:
        report = (MatchReport.model_validate_json(raw) if isinstance(raw, str) else MatchReport.model_validate(raw))
    except ValidationError as e:
        raise ValueError(f"Input format not valid: {e}") from e
    
    return chain.invoke(){
        "data": 
    })


    