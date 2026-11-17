from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
from uuid import UUID
from datetime import datetime

class Match(BaseModel):
    id: UUID
    external_id: int | None = None
    season_id: UUID
    date: datetime
    opponent: str = Field(min_length=1)
    is_home: bool
    venue: str | None = None
    goals_for: int = Field(ge=0)
    goals_against: int = Field(ge=0)
    created_at: datetime

class Event(BaseModel):
    model_config = ConfigDict(extra="allow")

class MatchReport(BaseModel):
    match: Match
    events: list[Event] = Field(default_factory=list)
    result: Literal["win","draw","loss"]
    related_documents: list[dict] = Field(default_factory=list)

    @model_validator(mode="after")
    def result_coherence_with_goal(self):
        gf, ga = self.match.goals_for, self.match.goals_against
        expected = "win" if gf > ga else "loss" if gf < ga else "draw"
        if self.result!=expected:
            raise ValueError(f"Result={self.result} is not coherent with the score {gf}-{ga}")
        return self

class Transfer(BaseModel):
    id: UUID
    player_id: UUID | None = None
    season_id: UUID
    type: Literal["in", "out"]
    transfer_date: datetime
    fee: float | None = None
    club: str | None = None
    notes: str | None = None

class TransferReport(BaseModel):
    transfer: Transfer
    player: dict = Field(default_factory=dict)
    related_documents: list[dict] = Field(default_factory=list)

class ServiceRequest(BaseModel):
    task: Literal["match-analysis", "transfer-advice"] = "match-analysis"
    raw: str | dict
    role: str | None = None

class Source(BaseModel):
    type: str
    label: str
    entity_id: str | None = None

class MatchAnalysis (BaseModel):
    summary: str
    facts: list[str] = Field(default_factory=list)
    key_factors: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    missing_data: list[str] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)


    
    