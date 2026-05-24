from dataclasses import dataclass
from io import BytesIO

import anyio
import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from app.config import get_settings


@dataclass
class UploadedImage:
    url: str
    public_id: str | None


def configure_cloudinary() -> None:
    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


async def upload_image(file: UploadFile) -> UploadedImage:
    settings = get_settings()
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Only image files are allowed")

    content = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image is too large. Maximum size is {settings.max_upload_mb} MB",
        )
    if not content:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Empty image file is not allowed")

    def _upload() -> dict:
        return cloudinary.uploader.upload(
            BytesIO(content),
            folder=settings.cloudinary_folder,
            resource_type="image",
            overwrite=False,
        )

    result = await anyio.to_thread.run_sync(_upload)
    return UploadedImage(url=result["secure_url"], public_id=result.get("public_id"))


async def delete_image(public_id: str | None) -> None:
    if not public_id:
        return

    def _delete() -> None:
        cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)

    await anyio.to_thread.run_sync(_delete)
