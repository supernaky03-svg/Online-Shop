from urllib.parse import urlparse

from fastapi import HTTPException, status

from app.schemas import BuyContactIn

ALLOWED_CONTACT_TYPES = {"facebook", "tiktok", "telegram", "viber"}


def clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def validate_post_fields(name: str, price: int, image_count: int) -> None:
    if not name.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Name is required")
    if price <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Price must be greater than 0")
    if image_count < 1 or image_count > 5:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Images must be between 1 and 5")


def validate_contacts(contacts: list[BuyContactIn]) -> list[BuyContactIn]:
    for item in contacts:
        contact_type = item.contact_type
        url = item.contact_url.strip()
        if contact_type not in ALLOWED_CONTACT_TYPES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported contact type")

        parsed = urlparse(url)
        if contact_type in {"facebook", "tiktok", "telegram"}:
            if parsed.scheme not in {"http", "https", "tg"}:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Invalid {contact_type} link")
            host = parsed.netloc.lower()
            if contact_type == "facebook" and not any(d in host for d in ["facebook.com", "fb.com", "m.me"]):
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Facebook link should use facebook.com, fb.com, or m.me")
            if contact_type == "tiktok" and "tiktok.com" not in host:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="TikTok link should use tiktok.com")
            if contact_type == "telegram" and parsed.scheme != "tg" and "t.me" not in host and "telegram.me" not in host:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Telegram link should use t.me, telegram.me, or tg://")
        elif contact_type == "viber":
            if parsed.scheme not in {"http", "https", "viber"}:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Viber link should use viber:// or https://")
    return contacts
