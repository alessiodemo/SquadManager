import json

from constants import *
from langchain_core.prompts import ChatPromptTemplate
from parameters_validation import MatchReport, TransferReport

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
            "related_documents": report.related_documents,
        }
    return data

def get_transfer_data(report: TransferReport) -> dict:
    return {
        "transfer": report.transfer.model_dump(mode="json"),
        "player": report.player,
        "related_documents": report.related_documents,
    }

def build_prompt(parser, task="match-analysis") -> ChatPromptTemplate:
    if task == "match-analysis":
        system_prompt = SYSTEM_PROMPT
        user_prompt = USER_PROMPT_TEMPLATE
    else:
        system_prompt = TRANSFER_SYSTEM_PROMPT
        user_prompt = TRANSFER_USER_PROMPT_TEMPLATE

    return ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_prompt),
    ]).partial(
        format_instructions=parser.get_format_instructions()
    )