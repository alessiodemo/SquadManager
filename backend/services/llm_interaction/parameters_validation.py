from pydantic import BaseModel, Field, ValidationError
from uuid import UUID
from datetime import datetime

class Match(BaseModel):
    id: UUID
    external_id: int
    season_id: UUID
    date: datetime
    opponent: str = Field(min_length=1)
    is_home: bool
    venue: str | None = None
    goals_for: int = Field(ge=0)
    goals_against: int = Field(ge=0)
    create_at: datetime

class Event(BaseModel)
    model_config = ConfigDict(extra="allow")

class MatchReport(BaseModel)
    match: Match
    event: Event
    result: Literal["win","draw","loss"]

    @model_validator(mode="after")
    def result_coherence_with_goal(self):
        gf, ga = self.match.goals_for, self.match.goals_against
        expected = "win" if gf > ga else "loss" if gf < ga else "draw"
        if self.result!=expected:
            raise ValueError(f"Result={self.result} is not coherent with the score {gf}-{ga}")
        return self

class ServiceRequest(BaseModel):
    raw: str
    role: str


    
    