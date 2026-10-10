import json

from constants import *

from backend.services.llm_interaction.parameters_validation import MatchReport


def get_data(report: MatchReport) -> list[dict]:
    data = {
            "data": report.match.date.date().isoformat(),
            "opponent": report.match.opponent,
            "at_home": report.match.is_home,
            "stadium": report.match.venue,
            "goals_scored": report.match.goals_for,
            "goals_conceded": report.match.goals_against,
            "score": report.result,
            "events": [e.model_dump() for e in report.event]
        }
    return data

def build_prompt(report: MatchReport, role: str) -> list[dict]:
    
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": USER_PROMPT_TEMPLATE.format(
            data=json.dumps(data, ensure_ascii=False, indent=2),
            task=role,
        )},
    ]