from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.cloudinary_service import delete_image, upload_image
from app.config import get_settings
from app.database import get_db
from app.models import BuyContact, Post, PostImage, Review
from app.schemas import LoginIn, LoginOut, PostDetailOut, PostListOut
from app.security import attach_session_cookie, clear_session_cookie, create_admin_token, require_admin
from app.utils import parse_contacts_json, parse_int_list_json
from app.validators import clean_optional, validate_contacts, validate_post_fields

router = APIRouter(prefix="/admin", tags=["admin"])


async def _get_post_or_404(db: AsyncSession, post_id: int) -> Post:
    post = await db.scalar(
        select(Post)
        .where(Post.id == post_id)
        .options(selectinload(Post.images), selectinload(Post.contacts), selectinload(Post.reviews))
    )
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


@router.post("/login", response_model=LoginOut)
async def login(payload: LoginIn, response: Response) -> dict[str, bool | str]:
    settings = get_settings()
    if payload.password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong password")
    token = create_admin_token()
    attach_session_cookie(response, token)
    return {"ok": True, "token": token}


@router.post("/logout", response_model=LoginOut)
async def logout(response: Response) -> dict[str, bool]:
    clear_session_cookie(response)
    return {"ok": True}


@router.get("/posts", response_model=list[PostListOut], dependencies=[Depends(require_admin)])
async def admin_posts(db: AsyncSession = Depends(get_db)) -> list[PostListOut]:
    posts = list(
        (
            await db.scalars(
                select(Post)
                .options(selectinload(Post.images), selectinload(Post.contacts))
                .order_by(Post.created_at.desc(), Post.id.desc())
            )
        )
        .unique()
        .all()
    )
    counts_result = await db.execute(
        select(Review.post_id, func.count(Review.id)).where(Review.post_id.in_([p.id for p in posts] or [0])).group_by(Review.post_id)
    )
    counts = {post_id: count for post_id, count in counts_result.all()}
    items = []
    for post in posts:
        item = PostListOut.model_validate(post)
        item.review_count = int(counts.get(post.id, 0))
        items.append(item)
    return items


@router.post("/posts", response_model=PostDetailOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_post(
    name: str = Form(...),
    price: int = Form(...),
    caption: str | None = Form(default=None),
    instock: str | None = Form(default=None),
    contacts: str | None = Form(default="[]"),
    images: list[UploadFile] | None = File(default=None),
    db: AsyncSession = Depends(get_db),
) -> PostDetailOut:
    files = images or []
    validate_post_fields(name=name, price=price, image_count=len(files))
    contact_items = validate_contacts(parse_contacts_json(contacts))

    uploaded_images = [await upload_image(file) for file in files]
    post = Post(name=name.strip(), price=price, caption=clean_optional(caption), instock=clean_optional(instock))
    post.images = [
        PostImage(image_url=image.url, cloudinary_public_id=image.public_id, sort_order=index)
        for index, image in enumerate(uploaded_images)
    ]
    post.contacts = [BuyContact(contact_type=item.contact_type, contact_url=item.contact_url.strip()) for item in contact_items]
    db.add(post)
    await db.commit()
    return await _admin_post_detail(db, post.id)


@router.put("/posts/{post_id}", response_model=PostDetailOut, dependencies=[Depends(require_admin)])
async def update_post(
    post_id: int,
    name: str = Form(...),
    price: int = Form(...),
    caption: str | None = Form(default=None),
    instock: str | None = Form(default=None),
    contacts: str | None = Form(default="[]"),
    keep_image_ids: str | None = Form(default="[]"),
    images: list[UploadFile] | None = File(default=None),
    db: AsyncSession = Depends(get_db),
) -> PostDetailOut:
    post = await _get_post_or_404(db, post_id)
    keep_ids = parse_int_list_json(keep_image_ids)
    new_files = images or []

    existing_by_id = {image.id: image for image in post.images}
    unknown_ids = [image_id for image_id in keep_ids if image_id not in existing_by_id]
    if unknown_ids:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Some image ids do not belong to this post")

    total_images = len(keep_ids) + len(new_files)
    validate_post_fields(name=name, price=price, image_count=total_images)
    contact_items = validate_contacts(parse_contacts_json(contacts))

    removed_images = [image for image in post.images if image.id not in keep_ids]
    for image in removed_images:
        await db.delete(image)

    uploaded_images = [await upload_image(file) for file in new_files]

    post.name = name.strip()
    post.price = price
    post.caption = clean_optional(caption)
    post.instock = clean_optional(instock)

    for contact in list(post.contacts):
        await db.delete(contact)
    post.contacts = [BuyContact(contact_type=item.contact_type, contact_url=item.contact_url.strip()) for item in contact_items]

    for index, image_id in enumerate(keep_ids):
        existing_by_id[image_id].sort_order = index
    start_index = len(keep_ids)
    for offset, image in enumerate(uploaded_images):
        db.add(PostImage(post_id=post.id, image_url=image.url, cloudinary_public_id=image.public_id, sort_order=start_index + offset))

    await db.commit()

    # Cloudinary cleanup is done after DB commit so a DB failure does not remove still-used images.
    for image in removed_images:
        await delete_image(image.cloudinary_public_id)

    return await _admin_post_detail(db, post.id)


@router.delete("/posts/{post_id}", response_model=LoginOut, dependencies=[Depends(require_admin)])
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, bool]:
    post = await _get_post_or_404(db, post_id)
    public_ids = [image.cloudinary_public_id for image in post.images]
    await db.delete(post)
    await db.commit()
    for public_id in public_ids:
        await delete_image(public_id)
    return {"ok": True}


@router.delete("/reviews/{review_id}", response_model=LoginOut, dependencies=[Depends(require_admin)])
async def delete_review(review_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, bool]:
    review = await db.scalar(select(Review).where(Review.id == review_id))
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    await db.delete(review)
    await db.commit()
    return {"ok": True}


@router.get("/posts/{post_id}", response_model=PostDetailOut, dependencies=[Depends(require_admin)])
async def _admin_post_detail(db: AsyncSession = Depends(get_db), post_id: int = 0) -> PostDetailOut:
    post = await _get_post_or_404(db, post_id)
    post.reviews.sort(key=lambda review: review.created_at, reverse=True)
    detail = PostDetailOut.model_validate(post)
    detail.review_count = len(post.reviews)
    return detail
