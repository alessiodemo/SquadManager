from typing import Protocol
from parameters_validation import MatchReport, TransferReport
from pydantic import ValidationError
from prompt_building import get_data, get_transfer_data
import json
 

class LLMClient(Protocol):
    def generate_report(
            self,
            raw: str | dict,
            role: str | None = None,
            task: str = "match-analysis",
        ) -> dict: ...

class LangChainClient:
    def __init__(self, chains):
        self.chains = chains

    def generate_report(self, raw: str | dict, role: str | None = None, task: str = "match-analysis") -> dict:
        try:
            payload = json.loads(raw) if isinstance(raw, str) else raw
            report = (
                MatchReport.model_validate(payload)
                if task == "match-analysis"
                else TransferReport.model_validate(payload)
            )
        except ValidationError as e:
            raise ValueError(f"Input format not valid: {e}") from e

        data = get_data(report) if task == "match-analysis" else get_transfer_data(report)
        chain = self.chains.get(task)
        if not chain:
            raise ValueError(f"No chain found for task: {task}")
        result = chain.invoke({
            "data": json.dumps(data, ensure_ascii=False, indent=2),
        })

        return result.model_dump()



