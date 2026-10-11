import json

from constants import *
from langchain_core.prompts import ChatPromptTemplate
from parameters_validation import MatchReport

def get_data(report: MatchReport) -> list[dict]:
    data = {
            "data": report.match.date.strftime("%Y-%m-%d"),
            "opponent": report.match.opponent,
            "at_home": report.match.is_home,
            "stadium": report.match.venue,
            "goals_scored": report.match.goals_for,
            "goals_conceded": report.match.goals_against,
            "score": report.result,
            "events": [e.model_dump() for e in report.events],
        }
    return data

def build_prompt() -> ChatPromptTemplate:
    
    return ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("user", USER_PROMPT_TEMPLATE),
    ])