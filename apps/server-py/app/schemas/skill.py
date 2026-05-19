from pydantic import BaseModel, Field


class AutocompleteQuery(BaseModel):
    q: str = Field(min_length=1, max_length=50)
