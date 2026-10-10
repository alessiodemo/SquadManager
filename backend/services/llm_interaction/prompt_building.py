import json

from constants import *
from langchain_core.prompts import ChatPromptTemplate
from parameters_validation import MatchReport

def get_data(report: MatchReport) -> list[dict]:
    data = {
            "data": report.match.date.date().isoformat(),
            "opponent": report.match.opponent,
            "at_home": report.match.is_home,
            "stadium": report.match.venue,
            "goals_scored": report.match.goals_for,
            "goals_conceded": report.match.goals_against,
            "score": report.result,
            "events": report.event.model_dump(),
        }
    return data

def build_prompt() -> ChatPromptTemplate:
    
    return ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("user", USER_PROMPT_TEMPLATE),
    ])