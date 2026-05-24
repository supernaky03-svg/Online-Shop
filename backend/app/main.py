from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.cloudinary_service import configure_cloudinary
from app.config import get_settings
from app.database import create_tables
from app.routers import admin, public

settings = get_settings()

app = FastAPI(title="Online Shop API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public.router)
app.include_router(admin.router)


@app.on_event("startup")
async def startup() -> None:
    configure_cloudinary()
    await create_tables()


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # FastAPI/HTTPException handlers still run normally; this keeps unexpected failures JSON-friendly.
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
