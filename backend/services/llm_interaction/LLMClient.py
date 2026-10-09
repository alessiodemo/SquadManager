from typing import Protocol
 

class LLMClient(Protocol):
    def complete(self, message: list[dict]) -> str: ...