from typing import Protocol
from parameters_validation import MatchReport
from pydantic import ValidationError
from prompt_building import get_data
import json
 

class LLMClient(Protocol):
    def generate_report(self, raw: str | dict, role: str | None = None) -> str: ...

class LangChainClient:
    def __init__(self, chain):
        self.chain = chain

    def generate_report(self, raw: str | dict, role: str | None = None) -> str:
        try:
            report = (MatchReport.model_validate_json(raw) if isinstance(raw, str) else MatchReport.model_validate(raw))
        except ValidationError as e:
            raise ValueError(f"Input format not valid: {e}") from e
        
        return self.chain.invoke({
            "data": json.dumps(get_data(report), ensure_ascii=False, indent=2),
        })



