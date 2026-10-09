import json

from backend.services.llm_interaction.parameters_validation import MatchReport


def build_prompt(report: MatchReport, role: str) -> list[dict]:
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

    return [
        {"role": "system", "content": "Your are an assistant that analyze football matches. Use only the given details, without guess other information"},
        {"role": "user", "content": f"Match Data:\n{json.dumps(data, ensure_ascii=False, indent=2)}\n\Role: {role}"},
    ]