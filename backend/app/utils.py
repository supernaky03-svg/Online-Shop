import json

from fastapi import HTTPException, status

from app.schemas import BuyContactIn


def parse_contacts_json(raw_contacts: str | None) -> list[BuyContactIn]:
    if not raw_contacts:
        return []
    try:
        payload = json.loads(raw_contacts)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid contacts JSON") from exc
    if not isinstance(payload, list):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Contacts must be a list")
    try:
        return [BuyContactIn(**item) for item in payload]
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


def parse_int_list_json(raw: str | None) -> list[int]:
    if not raw:
        return []
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid image ids JSON") from exc
    if not isinstance(payload, list):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Image ids must be a list")
    try:
        return [int(item) for item in payload]
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Image ids must be numbers") from exc
