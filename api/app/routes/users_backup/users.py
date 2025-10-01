from pydantic import BaseModel, Field


class User(BaseModel):
    name: str = Field(..., min_length=3, max_length=20)
    userid: str = Field(..., min_length=3, max_length=20)
    userType: str
    password: str = Field(..., min_length=6, max_length=20)
