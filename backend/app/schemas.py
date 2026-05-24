from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

ContactType = Literal["facebook", "tiktok", "telegram", "viber"]


class ImageOut(BaseModel):
    id: int
    image_url: str
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class BuyContactIn(BaseModel):
    contact_type: ContactType
    contact_url: str

    @field_validator("contact_url")
    @classmethod
    def contact_url_not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Contact URL is required")
        return value


class BuyContactOut(BaseModel):
    id: int
    contact_type: ContactType | str
    contact_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    gmail: EmailStr
    review_text: str = Field(min_length=1, max_length=2000)

    @field_validator("review_text")
    @classmethod
    def review_text_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Review text cannot be empty")
        return value


class ReviewOut(BaseModel):
    id: int
    post_id: int
    gmail: EmailStr | str
    review_text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PostListOut(BaseModel):
    id: int
    name: str
    instock: str | None
    caption: str | None
    price: int
    created_at: datetime
    updated_at: datetime
    images: list[ImageOut]
    contacts: list[BuyContactOut] = []
    review_count: int = 0

    model_config = {"from_attributes": True}


class PostDetailOut(PostListOut):
    reviews: list[ReviewOut] = []


class PaginatedPosts(BaseModel):
    items: list[PostListOut]
    total: int
    limit: int
    offset: int


class LoginIn(BaseModel):
    password: str


class LoginOut(BaseModel):
    ok: bool
    token: str | None = None
